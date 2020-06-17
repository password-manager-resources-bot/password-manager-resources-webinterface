async function validateForm(img) {

    let url = document.getElementById("url").value;
    const rule = createRuleString();

    console.log(rule);

    const data = {url: url, rule: rule, image: img};

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    return fetch('/api', options);

}


async function imageToBase64(file, callback) {

    const reader = new FileReader();
    reader.onload = function () {
        callback(btoa(reader.result));
    };
    reader.readAsBinaryString(file);
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

    console.log(maxlength);

    let rule = "";

    if (minlength !== "" && minlength > 0) {
        rule = rule.concat(`minlength: ${minlength}; `);
    }
    if (maxlength !== "" && maxlength > 0) {
        rule = rule.concat(`maxlength: ${maxlength}; `);
    }

    let charTypes = ["upper", "lower", "digit", "unicode", "ascii", "special"]

    let required = ""
    let allowed = "allowed: "

    let specialChars = document.getElementById("choose_special").value;

    if (specialChars.includes("]")) {
        specialChars = specialChars.replace("]", "").concat("]");
    }
    if (specialChars.includes("-")) {
        specialChars = "-".concat(specialChars.replace("-", ""));
    }

    charTypes.forEach((type) => {
        let req = document.getElementById("req_" + type).checked;
        if (req) {
            required = required.concat("required: ");
            let i = 0;
            while (i < document.getElementById("min_" + type).value) {
                if (type === "special" && specialChars !== "")
                    allowed = allowed.concat(`[${specialChars}], `)
                else
                    required = required.concat(type, '; ');
                i++;
            }
        } else {
            if (document.getElementById("alwd_" + type).checked) {
                if (type === "special" && specialChars !== "")
                    allowed = allowed.concat(`[${specialChars}], `)
                else
                    allowed = allowed.concat(type + ', ')
            }
        }
    });

    allowed = allowed.trimEnd();

    console.log(allowed)

    return rule.concat(required, allowed === "allowed:" ? "" : allowed.slice(0, allowed.length - 1).concat(";"));

}