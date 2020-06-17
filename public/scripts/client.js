async function validateForm() {

    let img = await imageToBase64(imageToBase64(document.getElementById("image").files[0]));
    let url = document.getElementById("url").value;
    const rule = createRuleString();

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


async function imageToBase64(file) {

    const reader = new FileReader();
    reader.readAsBinaryString(file);

    return await reader.onload = function () {
        return btoa(reader.result);
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

    let specialChars = document.getElementById("choose_special").value;

    if(specialChars.contains("]")){
        specialChars = specialChars.replace("]", "").concat("]");
    }
    if(specialChars.contains("-")){
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

    return rule.concat(required, allowed === "allowed: " ? "" : allowed);

}