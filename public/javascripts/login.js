"use strict";
import '/bootstrap/js/bootstrap.js';

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
        }).catch(err => displayError(err))
            .then((resolve) => {
                try {
                    if (resolve.status === 200) {
                        resolve.text().then(resolve => {
                            if (resolve === "Reload") {
                                location.reload();
                            } else {
                                displayError(resolve);
                            }
                        })
                    } else {
                        throw new Error('Ответ сети был не ok.');
                    }
                } catch (error) {
                    displayError("Ошибка HTTP: " + resolve.status);
                    console.log(error.message);
                }
            })
    })
}, 0);

function displayError(text = "", color = "red") {
    let toastText = document.querySelector(".toast-body");
    toastText.innerText = text.toString();
    let toastEl = document.querySelector(".toast");
    if (color === "green") {
        toastEl.classList.remove("bg-danger");
        toastEl.classList.add("bg-success");
    } else {
        toastEl.classList.remove("bg-success");
        toastEl.classList.add("bg-danger");
    }
    if (window.toastWindow) {
        toastWindow.show();
    } else {
        window.toastWindow = new bootstrap.Toast(toastEl);
        toastWindow.show();
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