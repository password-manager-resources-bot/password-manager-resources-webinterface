async function validateForm(imgURL) {

    let url = document.getElementById("url").value;
    const rule = createRuleString();

    const data = {url: url, rule: rule, image: imgURL};
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    fetch('/api', options).then(r => {
        console.log(r);
    }).catch(err => {
        console.log(err);
    });

}

function createRuleString() {

    let minlength = document.getElementById("minlength").value;
    let maxlength = document.getElementById("maxlength").value;

    let rule = `minlength: ${minlength}, maxlength: ${maxlength}, `;

    let charTypes = ["upper", "lower", "digit", "unicode", "ascii", "special"]

    let required = ""
    let allowed = "allowed: "

    let chooseSpecial = document.getElementById("choose_special").value
        = document.getElementById("choose_special").value
        .replace('\[', '\\\[')
        .replace('\]', '\\\]')
        .replace('\"', '\\\"')
        .replace("\'", '\\\'')
        .replace('\\', '\\\\');

    for (let type in charTypes) {
        let req = document.getElementById("req_" + type).checked;
        if (req) {
            required.concat("required: ");
            let i = 0;
            while (i < document.getElementById("min_" + type).value) {
                if (type === "special")
                    allowed.concat(`[${chooseSpecial}], `)
                else
                    required.concat(type + ",");
                i++;
            }
            required.slice(0, required.length - 1);
        } else {
            if (document.getElementById("alwd_" + type).checked) {
                if (type === "special")
                    allowed.concat(`[${chooseSpecial}], `)
                else
                    allowed.concat(type + ', ')
            }
        }
    }

    allowed.trimEnd().slice(0, allowed.length - 1);
    return rule.concat(required, allowed);

}

async function pictureUpload(file) {
    let form = new FormData();
    form.append("image", file)

    let settings = {
        "url": "https://api.imgbb.com/1/upload?key=6bd420fada17185594cfa7b12f95f0a5",
        "method": "POST",
        "timeout": 0,
        "processData": false,
        "mimeType": "multipart/form-data",
        "contentType": false,
        "data": form
    };


    await $.ajax(settings).done(function (response) {
        console.log(response);
        let jx = JSON.parse(response);
        return jx.data.url
    });
}
