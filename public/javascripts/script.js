setTimeout(() => {
    document.querySelector("input[type=button]").addEventListener("click", () => {
        let json = {
            login: document.querySelector("input[name=login]").value,
            password: document.querySelector("input[name=pass]").value
        }
        fetch("/admin/login", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(json)
        }).catch(err => print(err))
            .then((resolve) => {
                try {
                    if (resolve.status === 200) {
                        resolve.text().then(resolve => {
                            if (resolve === "Reload") {
                                location.reload();
                            } else {
                                print(resolve);
                            }
                        })
                    } else {
                        throw new Error('Ответ сети был не ok.');
                    }
                } catch (error) {
                    print("Ошибка HTTP: " + resolve.status);
                    console.log(error.message);
                }
            })
    })
}, 0);

function print(text) {
    if (text) {
        let p = document.createElement("p");
        p.innerText = text.toString();
        document.body.appendChild(p);
    }
}

document.addEventListener('keypress', (e) => {
    if (e.key === "Enter") {
        if (document.querySelector("input[name=login]").value === "") {
            document.querySelector("input[name=login]").focus();
        } else if (document.querySelector("input[name=pass]").value === "") {
            document.querySelector("input[name=pass]").focus();
        } else {
            document.querySelector("input[type=button]").click();
        }
    }
});