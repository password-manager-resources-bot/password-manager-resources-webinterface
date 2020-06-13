function validateForm() {

    let url = document.getElementById("url").value;
    const rule = createRuleString();

    const data = {url: url, rule: rule};

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    return fetch('/api', options);

}


function uploadFileToServer(file) {

    let img;
    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = function () {
        img = btoa(reader.result);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({image: img}),
            processData: false
        };

        fetch('/images', options).then(r => {
            // console.log(r);
        }).catch(err => {
            // console.log(err);
        });

    };
}

function chooseSpecial() {
    document.getElementById("choose_special").hidden = !document.getElementById("alwd_special").checked;
}

function clickedCheckbox(source) {

    let bool = document.getElementById("req_" + source).checked;

    document.getElementById("min_" + source).hidden = !bool;
    document.getElementById("alwd_" + source).checked = bool;
    document.getElementById("alwd_" + source).disabled = bool;

    if (source === 'special') {
        chooseSpecial();
    }
}

function createRuleString() {

    let minlength = document.getElementById("minlength").value;
    let maxlength = document.getElementById("maxlength").value;

    let rule = `minlength: ${minlength}, maxlength: ${maxlength}, `;

    let charTypes = ["upper", "lower", "digit", "unicode", "ascii", "special"]

    let required = ""
    let allowed = "allowed: "

    let chooseSpecial = document.getElementById("choose_special").value
        .replace('[', '\\[')
        .replace(']', '\\]')
        .replace('"', '\\"')
        .replace("'", "\\'")

    charTypes.forEach((type) => {
        let req = document.getElementById("req_" + type).checked;
        if (req) {
            required = required.concat("required: ");
            let i = 0;
            while (i < document.getElementById("min_" + type).value) {
                if (type === "special" && chooseSpecial != null)
                    allowed = allowed.concat(`[${chooseSpecial}], `)
                else
                    required = required.concat(type, ', ');
                i++;
            }
        } else {
            if (document.getElementById("alwd_" + type).checked) {
                if (type === "special" && chooseSpecial != null)
                    allowed = allowed.concat(`[${chooseSpecial}], `)
                else
                    allowed = allowed.concat(type + ', ')
            }
        }
    });

    allowed = allowed.slice(0, allowed.length - 2);
    if (allowed === "allowed")
        required = required.slice(0, required.length - 2);

    return rule.concat(required, allowed === "allowed" ? "" : allowed);

}