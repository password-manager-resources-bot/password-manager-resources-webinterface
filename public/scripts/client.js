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
    document.getElementById("choose_special_container").hidden = !document.getElementById("alwd_special").checked;
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

    let rule = "";

    if (maxlength != null && maxlength !== 0) {
        rule = rule.concat(`minlength: ${minlength};`);
    }
    if (minlength != null && maxlength !== 0) {
        rule = rule.concat(`maxlength: ${maxlength}; `);
    }

    let charTypes = ["upper", "lower", "digit", "unicode", "ascii", "special"]

    let required = ""
    let allowed = "allowed: "

    let chooseSpecial = document.getElementById("choose_special").value
        .replace('[', '\[')
        .replace(']', '\]')
        .replace('"', '\"')
        .replace("'", "\'")

    charTypes.forEach((type) => {
        let req = document.getElementById("req_" + type).checked;
        if (req) {
            required = required.concat("required: ");
            let i = 0;
            while (i < document.getElementById("min_" + type).value) {
                if (type === "special" && chooseSpecial !== "")
                    allowed = allowed.concat(`[${chooseSpecial}], `)
                else
                    required = required.concat(type, '; ');
                i++;
            }
        } else {
            if (document.getElementById("alwd_" + type).checked) {
                if (type === "special" && chooseSpecial !== "")
                    allowed = allowed.concat(`[${chooseSpecial}], `)
                else
                    allowed = allowed.concat(type + '; ')
            }
        }
    });

    return rule.concat(required, allowed === "allowed: " ? "" : allowed);

}