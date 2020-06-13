if (process.env.GITHUB_TOKEN == null) {
    require('dotenv').config() //just for local use
}

const {JSDOM} = require("jsdom");
const {window} = new JSDOM("");
const $ = require("jquery")(window);
const request = require('request');

const {Octokit} = require("@octokit/rest");
const github = new Octokit({auth: process.env.GITHUB_TOKEN, log: console});

const express = require('express');
const app = express();

let image = "";

const GITHUB_USER = "password-manager-resources-bot";
const GITHUB_REPO = "password-manager-resources";

app.listen(process.env.PORT || 3000, () => console.log("listen!"));
app.use(express.static('public'));
app.use(express.json());

app.post(`/api`, (request, response) => {

    console.log("received request");
    uploadToGitHub(request);
    response.end("Request sent");

});

app.post('/images', (req, res) => {

    console.log("got it")
    image = req.body.image;
    res.end("Image received");
});

async function uploadToGitHub(request) {
    console.log(request.body);
    const imageURL = await uploadImage();
    console.log(imageURL);
    pullRequest(request.body.url, request.body.rule, imageURL);
}

function uploadImage() {

    return new Promise((resolve, reject) => {
        request.post({
                url: `https://api.imgbb.com/1/upload`,
                headers: {
                    'Content-Type': 'application/json'
                },
                formData: {image: image, key: process.env.IMGBB_API_KEY}
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

function pullRequest(url, rule, imageURL) {

    //TODO split into individual functions

    console.log("exec:")

    $.getJSON('https://raw.githubusercontent.com/apple/password-manager-resources/main/quirks/password-rules.json', function (passwordRules) {

        passwordRules[url] = {'password-rules': rule};

        let passwordRulesSorted = {};
        Object.keys(passwordRules).sort().forEach(each => {
            passwordRulesSorted[each] = passwordRules[each];
        });

        console.log("passwordRulesSorted" + passwordRulesSorted);

        github.git.getRef({
            owner: "apple",
            repo: GITHUB_REPO,
            ref: "heads/main"
        }).then((data) => {

            console.log("master branch found!");

            let master_sha = data.data.object.sha;

            github.git.createRef({
                owner: GITHUB_USER,
                repo: GITHUB_REPO,
                ref: "refs/heads/" + url,
                sha: master_sha
            }).then(() => {
                console.log("Branch created!");

                createCommit("quirks/password-rules.json", passwordRulesSorted, url)
                    .then((b) => {
                        github.pulls.create({
                            owner: GITHUB_USER, //TODO change to "apple"
                            repo: GITHUB_REPO,
                            title: `Add website ${url}`,
                            base: "main",
                            head: "password-manager-resources-bot:" + url,
                            body: "**Don't** pull these changes in, will be closed shortly.\n" +
                                `![](${imageURL})`,
                            maintainer_can_modify: true
                        }).then(() => {
                            console.log("PR created to " + "bot"); //TODO -> apple
                        }).catch((err) => {
                            console.log("Can't create PR!");
                            console.log(err);
                        });
                    });
            }).catch((err) => {
                console.log("Branch can't be created. It already exists.")
                console.log(err);
            });
        }).catch((err) => {
            console.log("Can't find master branch!");
            console.log(err);
        });
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
            ref: "heads" + url,
            sha: commit.data.sha,
        });

        console.log("Committed!");

        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}