"use strict";
import '/bootstrap/js/bootstrap.js';

fetch("uploadxlsx/awaitupload", {
    method: 'POST'
}).catch(err => displayError(err.message))
    .then((resolve) => {
        console.log(resolve);
        try {
            if (resolve.status === 200) {
                resolve.text().then(resolve => {
                    if (resolve === "Reload") {
                        location.href = '../../admin';
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

function displayError(text = "Ошибка без сообщения", color = "red") {
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