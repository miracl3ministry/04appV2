"use strict";
import '/bootstrap/js/bootstrap.js';

const goodsOrder = ['id', 'name', 'manufacturer', 'code', 'modificationCode', 'model', 'price', 'count', 'rack', 'shelf'];
let table, maxID;

function getFetchData(path, data, callback) {
    fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }).catch(err => displayError(err))
        .then(async (resolve) => {
            try {
                if (resolve.status === 200) {
                    let ans = await resolve.json();
                    // console.log(ans);
                    callback(null, ans);
                } else {
                    throw new Error('Ответ сети был не ok.');
                }
            } catch (error) {
                displayError("Ошибка HTTP: ", resolve.status, error.message);
                console.log(error.message);
                callback(error);
            }
        })
}
function displayError(text, color = "red") {
    if (text) {
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
}

function printHtmlTable(data) {
    document.getElementById("table").innerText = "";
    for (let i in data) {
        let tableRow = document.createElement("tr");
        tableRow.dataset.id = data[i].id;
        let hiddenRow = addCollapsedRow(data[i]);
        tableRow.addEventListener("click", (e) => {
            if (tableRow.dataset.opened === 'true') {
                tableRow.dataset.opened = 'false';
                hiddenRow.style.height = "0px";
                hiddenRow.style.display = "none";
            } else {
                tableRow.dataset.opened = 'true';
                hiddenRow.style.height = "100%";
                hiddenRow.style.display = "table-row";
            }
        })
        printHtmlTd(data[i], tableRow);
        document.getElementById("table").append(tableRow);
        document.getElementById("table").append(hiddenRow);
    }
}
function printHtmlTd(obj, el) {
    for (let i in goodsOrder) {
        let td = document.createElement("td");
        td.dataset.name = goodsOrder[i];
        td.textContent = obj[goodsOrder[i]];
        el.append(td);
    }
}
function addCollapsedRow(data) {
    let td = document.createElement("td");
    td.setAttribute("colspan", "10");
    let div = document.createElement('div');
    div.classList.add('collapsedTdFlex');

    let descriptionDiv = document.createElement('div');
    let span = document.createElement("span");
    span.innerText = "Описание: ";
    span.style.fontWeight = '600';
    descriptionDiv.append(span);
    let description = document.createElement("p");
    description.dataset.name = 'description';
    description.innerText = data.description;
    descriptionDiv.append(description);
    div.append(descriptionDiv);

    let specificationsDiv = document.createElement('div');
    span = document.createElement("span");
    span.innerText = "Характеристики: ";
    span.style.fontWeight = '600';
    specificationsDiv.append(span);
    let specifications = document.createElement("p");
    specifications.dataset.name = 'specifications';
    specifications.innerText = data.specifications;
    specificationsDiv.append(specifications);
    div.append(specificationsDiv);

    let linksDiv = document.createElement("div");
    let a1 = document.createElement('a');
    a1.innerText = 'Изменить';
    a1.href = '';
    a1.dataset.bsToggle = "modal";
    a1.dataset.bsTarget = "#modalUpdate";
    a1.addEventListener('click', e => {
        e.preventDefault();
        updateItem(data.id, e);
    })
    linksDiv.append(a1);
    linksDiv.append(document.createElement('br'))

    let a2 = document.createElement('a');
    a2.innerText = 'Удалить';
    a2.href = '';
    a2.dataset.bsToggle = "modal";
    a2.dataset.bsTarget = "#modalDelete";
    a2.addEventListener('click', e => {
        e.preventDefault();
        deleteItem(data.id, e);
    })
    linksDiv.append(a2);
    div.append(linksDiv);

    td.append(div);
    let tr = document.createElement("tr");
    tr.style.display = "none";
    tr.style.cursor = 'initial';
    tr.append(td);
    return tr;
}
function updateItem(dataID) {
    let form = document.forms.modalUpdateForm;
    form.reset();
    for (let key of goodsOrder) {
        form.querySelector(`input[name=${key}]`).value = table[dataID][key] ?? '';
    }
    form.querySelector("textarea[name=description]").value = table[dataID][description] ?? '';
    form.querySelector("textarea[name=specifications]").value = table[dataID][specifications] ?? '';
}
function deleteItem(dataID, el) {
    let form = document.forms.modalDeleteForm;
    form.querySelector('input[name=id]').value = table[dataID].id;
}

getFetchData('/app/gettable', {search: false, page: 1, order: null}, (err, data) => {
    if (err) {
        console.log(err)
    } else {
        if (!Array.isArray(data)) {
            data = [data];
        }
        table = data;
        console.log(table)
        printHtmlTable(data);
    }
})
document.getElementById("btnAddProduct").addEventListener("click", () => {
    let form = document.forms.modalAddForm;
    if (form.querySelector("input[name=name]").value == "") {
        form.querySelector("input[name=name]").classList.add('redBorder');
        return 0;
    }
    form.querySelector("input[name=name]").classList.remove('redBorder');
    let jsonData = {
        name: form.querySelector("input[name=name]").value,
        manufacturer: form.querySelector("input[name=manufacturer]").value,
        code: form.querySelector("input[name=code]").value,
        modificationCode: form.querySelector("input[name=modificationCode]").value,
        model: form.querySelector("input[name=model]").value,
        price: form.querySelector("input[name=price]").value,
        count: form.querySelector("input[name=count]").value,
        rack: form.querySelector("input[name=rack]").value,
        shelf: form.querySelector("input[name=shelf]").value,
        description: form.querySelector("textarea[name=description]").value,
        specifications: form.querySelector("textarea[name=specifications]").value,
    }
    getFetchData('/app/add', jsonData, (err, data) => {
        if (err) {
            displayError(err)
        } else {
            console.log(data);
            displayError(data.message, data.color);
            if (data.status === 'ok') {
                jsonData.id = table.length;
                table.push(jsonData);
                printHtmlTable(table);
            }
        }
    })
    form.reset();
    document.getElementById('modalAdd').querySelector(".btn-close").click();
})
document.getElementById('modalAdd').addEventListener("hide.bs.modal", () => {
    document.forms.modalAddForm.querySelector("input[name=name]").classList.remove('redBorder');
    document.forms.modalAddForm.reset()
})
document.getElementById('btnUpdateProduct').addEventListener("click", () => {
    let form = document.forms.modalUpdateForm;
    if (form.querySelector("input[name=name]").value == "") {
        form.querySelector("input[name=name]").classList.add('redBorder');
        return 0;
    }
    form.querySelector("input[name=name]").classList.remove('redBorder');
    let jsonData = {
        id: form.querySelector("input[name=id]").value,
        name: form.querySelector("input[name=name]").value,
        manufacturer: form.querySelector("input[name=manufacturer]").value,
        code: form.querySelector("input[name=code]").value,
        modificationCode: form.querySelector("input[name=modificationCode]").value,
        model: form.querySelector("input[name=model]").value,
        price: form.querySelector("input[name=price]").value,
        count: form.querySelector("input[name=count]").value,
        rack: form.querySelector("input[name=rack]").value,
        shelf: form.querySelector("input[name=shelf]").value,
        description: form.querySelector("textarea[name=description]").value,
        specifications: form.querySelector("textarea[name=specifications]").value,
    }
    getFetchData('/app/update', jsonData, (err, data) => {
        if (err) {
            displayError(err)
        } else  {
            displayError(data.message, data.color);
            if (data.status === 'ok') {
                table[jsonData.id] = jsonData;
                printHtmlTable(table);
            }
        }
    })
    form.reset();
    document.getElementById('modalUpdate').querySelector(".btn-close").click();
})
document.getElementById('modalUpdate').addEventListener("hide.bs.modal", () => {
    document.forms.modalUpdateForm.querySelector("input[name=name]").classList.remove('redBorder');
    document.forms.modalUpdateForm.reset()
})
document.getElementById('btnDeleteProduct').addEventListener("click", () => {
    let form = document.forms.modalDeleteForm;
    let jsonData = {
        id: form.querySelector("input[name=id]").value,
    }
    getFetchData('/app/delete', jsonData, (err, data) => {
        if (err) {
            displayError(err)
        } else {
            displayError(data.message, data.color);
            if (data.status === 'ok') {
                delete table[jsonData.id];
                printHtmlTable(table);
            }
        }
    })
    form.reset();
    document.getElementById('modalDelete').querySelector(".btn-close").click();
})
document.getElementById('modalDelete').addEventListener("hide.bs.modal", () => {
    document.forms.modalDeleteForm.reset()
})