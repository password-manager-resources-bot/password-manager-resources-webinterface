async function validateForm() {

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

    return false;

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
        .replace('\\', '\\\\')
        .replace('\[', '\\\[')
        .replace('\]', '\\\]')
        .replace('\"', '\\\"')
        .replace("\'", '\\\'')

    console.log(chooseSpecial)

    charTypes.forEach((type) => {
        console.log(type);//
        let req = document.getElementById("req_" + type).checked;
        if (req) {
            console.log(req)//
            required = required.concat("required: ");
            let i = 0;
            while (i < document.getElementById("min_" + type).value) {
                console.log("running...")//
                if (type === "special")
                    allowed = allowed.concat(`[${chooseSpecial}], `)
                else
                    required = required.concat(type, ', ');
                i++;
            }
        } else {
            if (document.getElementById("alwd_" + type).checked) {
                if (type === "special")
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