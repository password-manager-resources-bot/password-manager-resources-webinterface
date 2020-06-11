function validateForm() {
    //TODO: create rule from form

    let url = document.getElementById("url").value;
    let pic = document.getElementById("picture").value;

    const data = {url: url, rule: "", picture: Buffer.from(pic).toString('base64')};
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