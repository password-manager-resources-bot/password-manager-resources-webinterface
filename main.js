const {JSDOM} = require("jsdom");
const {window} = new JSDOM("");
const $ = require("jquery")(window);

const Octokat = require("octokat");
const github = new Octokat({'token': process.env.GITHUB_TOKEN});
console.log("created: " + github.toString());

const express = require('express');
const app = express();


app.listen(process.env.PORT || 3000, () => console.log("listen on port 3000!"));
app.use(express.static('public'));
app.use(express.json());

app.post('/api', (request, response) => {
    console.log(request.body);
    pullRequest("password-manager-resources-bot/password-manager-resources", request.body['url'], request.body['rule']);
});

function pullRequest(repositoryURL, url, rule) {

    let repo = getRepo(repositoryURL);

    $.getJSON('https://raw.githubusercontent.com/password-manager-resources-bot/password-manager-resources/master/quirks/password-rules.json', function (passwordRules) {

        passwordRules[url] = {'password-rules': rule};

        let passwordRulesSorted = {};
        Object.keys(passwordRules).sort().forEach(each => {
            passwordRulesSorted[each] = passwordRules[each];
        });

        repo.branches("master").fetch().then((data) => {

            console.log("master branch found!");
            let master_sha = data["commit"]["sha"];

            repo.git.refs.create({
                ref: "refs/heads/" + url,
                sha: master_sha
            }).then(() => {
                console.log("Branch created!");

                createCommit(repo, "quirks/password-rules.json", passwordRulesSorted, url)
                    .then((b) => {
                        setTimeout(() => {
                            getRepo("password-manager-resources-bot/password-manager-resources").pulls.create({
                                title: `Add website ${url} | This PR was created automatically, please ignore it until this feature is ready to use!`,
                                body: "**Don't** pull these changes in, will be closed shortly.",
                                head: "password-manager-resources-bot:" + url,
                                base: "master" // change to master
                            }).then(() => {
                                console.log("PR created to " + repositoryURL);
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

const getRepo = (repositoryUrl) => {

    const [user, repoName] = repositoryUrl.split('/');

    if (user === null || repoName === null) {
        console.log("Please specify a repo");
        return;
    }

    return github.repos(user, repoName);
}

const createCommit = async (repo, filename, data, url) => {
    try {
        const path = filename.toLowerCase();
        let main = await repo.git.refs("heads/" + url).fetch();
        let treeItems = [];
        let file = await repo.git.blobs.create({
            content: Buffer.from(JSON.stringify(data, null, 4,)).toString('base64'),
            encoding: 'base64'
        });

        treeItems.push({
            path: path,
            sha: file.sha,
            mode: "100644",
            type: "blob"
        });

        let tree = await repo.git.trees.create({
            tree: treeItems,
            base_tree: main.object.sha
        });

        let commit = await repo.git.commits.create({
            //Commit message
            message: `Created via Web - ${url}`,
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