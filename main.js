if (process.env.GITHUB_TOKEN == null) {
    require('dotenv').config() //just for local use
}

const {JSDOM} = require("jsdom");
const {window} = new JSDOM("");
const $ = require("jquery")(window);
const request = require('request');

const {Octokit} = require("@octokit/rest");
const github = new Octokit({auth: process.env.GITHUB_TOKEN});

const express = require('express');
const app = express();

const GITHUB_USER = "password-manager-resources-bot";
const GITHUB_REPO = "password-manager-resources";

app.listen(process.env.PORT || 3000, () => console.log("listen!"));
app.use(express.static('public'));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb'}));
app.use(express.json());

app.post(`/api`, (request, response) => {
    //console.log("received request");
    uploadToGitHub(request).then();
    response.end("Request sent");

});

async function uploadToGitHub(request) {
    const imageURL = await uploadImage(request.body.image);
    await githubRequest(request.body.url, request.body.rule, imageURL);
}

function uploadImage(base64) {

    return new Promise((resolve, reject) => {
        request.post({
                url: `https://api.imgbb.com/1/upload`,
                headers: {
                    'Content-Type': 'application/json'
                },
                formData: {image: base64, key: process.env.IMGBB_API_KEY}
            },
            (err, httpResponse, body) => {
                if (err) {
                    console.error('Upload failed:\n', err);
                    reject(err);
                }
                resolve(JSON.parse(body).data.url);
            });
    });
}

async function githubRequest(url, rule, imageURL) {

    //TODO split into individual functions

    const jsonFile = await $.getJSON('https://raw.githubusercontent.com/apple/password-manager-resources/main/quirks/password-rules.json');

    jsonFile[url] = {'password-rules': rule};

    let passwordRulesSorted = {};
    Object.keys(jsonFile).sort().forEach(each => {
        passwordRulesSorted[each] = jsonFile[each];
    });

    const response = await github.git.getRef({
        owner: "apple",
        repo: GITHUB_REPO,
        ref: "heads/main"
    });

    await github.git.createRef({
        owner: GITHUB_USER,
        repo: GITHUB_REPO,
        ref: "refs/heads/" + url,
        sha: response.data.object.sha
    });

    await createCommit("quirks/password-rules.json", passwordRulesSorted, url);

    await github.pulls.create({
        owner: "apple",
        repo: GITHUB_REPO,
        title: `Add website ${url} | from Web-interface`,
        base: "main",
        head: "password-manager-resources-bot:" + url,
        body: `Password Rule validation:` +
            `![](${imageURL})`,
        maintainer_can_modify: true
    }).then(() => {
        console.log("PR created to apple");
    }).catch((err) => {
        console.log("Can't create PR!");
        console.log(err);
    });

}

async function createCommit(filename, data, url) {
    try {

        let newBranch = await github.repos.getBranch({
            owner: GITHUB_USER,
            repo: GITHUB_REPO,
            branch: url
        });

        let blob = await github.git.createBlob({
            owner: GITHUB_USER,
            repo: GITHUB_REPO,
            content: Buffer.from(JSON.stringify(data, null, 4)).toString('base64'),
            encoding: 'base64'
        });

        let treeItems = [];
        treeItems.push({
            path: filename,
            sha: blob.data.sha,
            mode: "100644",
            type: "blob"
        });

        let tree = await github.git.createTree({
            owner: GITHUB_USER,
            repo: GITHUB_REPO,
            tree: treeItems,
            base_tree: newBranch.data.commit.commit.tree.sha
        });

        let commit = await github.git.createCommit({
            owner: GITHUB_USER,
            repo: GITHUB_REPO,
            message: `Created via web-interface - ${url}`,
            tree: tree.data.sha,
            parents: [newBranch.data.commit.sha]
        });

        await github.git.updateRef({
            owner: GITHUB_USER,
            repo: GITHUB_REPO,
            ref: "heads/" + url,
            sha: commit.data.sha,
        });

        //console.log("Committed!");

    } catch (err) {
        console.error(err);
    }
}