const {JSDOM} = require("jsdom");
const {window} = new JSDOM("");
const $ = require("jquery")(window);

const {Octokit} = require("@octokit/rest");
const github = new Octokit({'auth': process.env.GITHUB_TOKEN});
console.log("created: " + github.toString());

const express = require('express');
const app = express();

const GITHUB_USER = "password-manager-resources-bot";
const GITHUB_REPO = "password-manager-resources";

app.listen(process.env.PORT || 3000, () => console.log("listen on port 3000!"));
app.use(express.static('public'));
app.use(express.json());

app.post('/api', (request, response) => {
    console.log(request.body);
    pullRequest(request.body.url, request.body.rule, request.body.image);
});

function pullRequest(url, rule, image) {

    $.getJSON('https://raw.githubusercontent.com/apple/password-manager-resources/master/quirks/password-rules.json', function (passwordRules) {

        passwordRules[url] = {'password-rules': rule};

        let passwordRulesSorted = {};
        Object.keys(passwordRules).sort().forEach(each => {
            passwordRulesSorted[each] = passwordRules[each];
        });

        github.repos.getBranch({
            owner: GITHUB_USER,
            repo: GITHUB_REPO,
            branch: "master"
        }).then((data) => {

            console.log("master branch found!");

            let master_sha = data.commit.sha;

            github.git.createRef({
                owner: GITHUB_USER,
                repo: GITHUB_REPO,
                ref: "refs/heads/" + url,
                sha: master_sha
            }).then(() => {
                console.log("Branch created!");

                createCommit("quirks/password-rules.json", passwordRulesSorted, url)
                    .then((b) => {
                        setTimeout(() => {
                            github.pulls.create({
                                owner: GITHUB_USER, //TODO change to "apple"
                                repo: GITHUB_REPO,
                                title: `Add website ${url} | This PR was created automatically, please ignore it until this feature is ready to use!`,
                                head: "password-manager-resources-bot:" + url,
                                base: "master",
                                body: "**Don't** pull these changes in, will be closed shortly.\n" +
                                    `![](${picture})`,
                                maintainer_can_modify: true
                            }).then(() => {
                                console.log("PR created to " + "bot"); //TODO
                            }).catch((err) => {
                                console.log("Can't create PR!");
                                console.log(err);
                            });
                        }, 4000);
                    });
            }).catch(() => {
                console.log("Branch can't be created. It already exists.")
            });
        }).catch(() => {
            console.log("Can't find master branch!");
        });
    });
}

async function createCommit(filename, data, url) {
    try {
        const path = filename;
        let main = await github.git.getRef({
            owner: GITHUB_USER,
            repo: GITHUB_REPO,
            ref: "heads/" + url
        });
        let treeItems = [];
        let file = await github.git.createBlob({
            owner: GITHUB_USER,
            repo: GITHUB_REPO,
            content: Buffer.from(JSON.stringify(data, null, 4,)).toString('base64'),
            encoding: 'base64'
        });

        treeItems.push({
            path: path,
            sha: file.sha,
            mode: "100644",
            type: "blob"
        });

        let tree = await github.git.createTree({
            owner: GITHUB_USER,
            repo: GITHUB_REPO,
            tree: treeItems,
            base_tree: main.object.sha
        });

        let commit = await github.git.createCommit({
            owner: GITHUB_USER,
            repo: GITHUB_REPO,
            message: `Created via web-interface - ${url}`,
            tree: tree.sha,
            parents: [main.object.sha]
        });

        main.update({sha: commit.sha})

        console.log("Commited!");
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}