"use strict";
import '/bootstrap/js/bootstrap.js';

const goodsOrder = ['id', 'name', 'manufacturer', 'code', 'modificationCode', 'model', 'price', 'count', 'warehouse', 'rack', 'shelf'];
let table;
let tableSettings = {
    timeout: false,
}

function getFetchData(path, data, callback) {
    fetch(path, {
        method: 'POST',
        credentials: "same-origin",
        headers: {
            'Content-Type': 'application/json',
            cookie: document.cookie,
        },
        cache: "no-cache",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        body: JSON.stringify(data)
    }).catch(err => displayError(err))
        .then(async (resolve) => {
            try {
                if (resolve.status === 200) {
                    let ans = await resolve.json();
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
function displayError(text = "Ошибка", color = "red") {
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
function printHtmlTable(data) {
    console.log(data);
    document.getElementById("table").innerText = "";
    for (let i in data) {
        let tableRow = document.createElement("tr");
        tableRow.dataset.id = data[i].id;
        let hiddenRow = addCollapsedRow(data[i], i);
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
function addCollapsedRow(data, placeInTableArr) {
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
        updateItem(data.id, placeInTableArr);
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
        deleteItem(data.id, placeInTableArr);
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

function updateItem(dataID, dataPlaceInTableArr) {
    let form = document.forms.modalUpdateForm;
    form.reset();
    for (let key of goodsOrder) {
        form.querySelector(`input[name=${key}]`).value = table[dataPlaceInTableArr][key] ?? '';
    }
    form.querySelector("input[name=placeInArr]").value = dataPlaceInTableArr;
    form.querySelector("textarea[name=description]").value = table[dataPlaceInTableArr]['description'] ?? '';
    form.querySelector("textarea[name=specifications]").value = table[dataPlaceInTableArr]['specifications'] ?? '';
}

function deleteItem(dataID, dataPlaceInTableArr) {
    let form = document.forms.modalDeleteForm;
    form.querySelector('input[name=id]').value = dataID;
    form.querySelector('input[name=placeInArr]').value = dataPlaceInTableArr;
}
async function gettable(search = false, page = 1, order = null) {
    if (!tableSettings.timeout) {
        tableSettings.search = search;
        tableSettings.page = page;
        tableSettings.order = order;
        getFetchData('/app/gettable', {search: search, page: page, order: order}, (err, data) => {
            if (err) {
                console.log(err)
            } else {
                if (!Array.isArray(data)) {
                    data = [data];
                }
                table = data;
                printHtmlTable(data);
            }
        })
    }
}
async function getNextTablePage() {
    if (!tableSettings.timeout) {
        tableSettings.page += 1;
        tableSettings.timeout = true;
        getFetchData('/app/gettable', {
            search: tableSettings.search,
            page: tableSettings.page,
            order: tableSettings.order
        }, (err, data) => {
            if (err) {
                console.log(err)
            } else {
                if (!Array.isArray(data)) {
                    data = [data];
                }
                table.push(...data);
                printHtmlTable(table);
            }
        })
        setTimeout(() => {
            tableSettings.timeout = false;
        }, 1000)
    }
}

// header buttons
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
        warehouse: form.querySelector("input[name=warehouse]").value,
        rack: form.querySelector("input[name=rack]").value,
        shelf: form.querySelector("input[name=shelf]").value,
        description: form.querySelector("textarea[name=description]").value,
        specifications: form.querySelector("textarea[name=specifications]").value,
    }
    getFetchData('/app/add', jsonData, (err, data) => {
        if (err) {
            displayError(err)
        } else {
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
        placeInTableArr: form.querySelector("input[name=placeInArr]").value,
        id: form.querySelector("input[name=id]").value,
        name: form.querySelector("input[name=name]").value,
        manufacturer: form.querySelector("input[name=manufacturer]").value,
        code: form.querySelector("input[name=code]").value,
        modificationCode: form.querySelector("input[name=modificationCode]").value,
        model: form.querySelector("input[name=model]").value,
        price: form.querySelector("input[name=price]").value,
        count: form.querySelector("input[name=count]").value,
        warehouse: form.querySelector("input[name=warehouse]").value,
        rack: form.querySelector("input[name=rack]").value,
        shelf: form.querySelector("input[name=shelf]").value,
        description: form.querySelector("textarea[name=description]").value,
        specifications: form.querySelector("textarea[name=specifications]").value,
    }
    console.log(jsonData);
    getFetchData('/app/update', jsonData, (err, data) => {
        if (err) {
            displayError(err)
        } else {
            displayError(data.message, data.color);
            if (data.status === 'ok') {
                table[jsonData.placeInTableArr] = jsonData;
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
        placeInArr: form.querySelector('input[name=placeInArr]').value,
    }
    getFetchData('/app/delete', jsonData, (err, data) => {
        if (err) {
            displayError(err)
        } else {
            displayError(data.message, data.color);
            if (data.status === 'ok') {
                delete table[jsonData.placeInArr];
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
document.getElementById('btnUploadXlsx').addEventListener("click", () => {
    document.forms.modalUploadXlsx.submit();
    document.forms.modalUploadXlsx.reset();
    document.getElementById('modalDelete').querySelector(".btn-close").click();
})
document.getElementById('modalUploadXlsx').addEventListener("hide.bs.modal", () => {
    document.forms.modalUploadXlsx.reset()
})
document.getElementById('btnUnloadXlsx').addEventListener("click", () => {
    getFetchData('/app/unloadxlsx', {}, (err, data) => {
        if (err) {
            displayError(err)
        } else {
            window.open('/xls/' + data.message, '_blank');
            displayError(data.message, data.color);
        }
    })
})
// scroll event
document.addEventListener("scroll", (e) => {
    if (window.pageYOffset + document.documentElement.clientHeight >= document.body.offsetHeight) {
        getNextTablePage();
    }
})
// table header sort events
document.querySelectorAll('th').forEach(el => {
    el.addEventListener('click', (e) => {
        if (e.target.dataset.arrow === 'up') {
            e.target.dataset.arrow = 'down';
            gettable(tableSettings.search, 1, [el.dataset.name, 1]);
        } else if (e.target.dataset.arrow === 'down') {
            e.target.dataset.arrow = 'none';
        } else {
            e.target.dataset.arrow = 'up';
            gettable(tableSettings.search, 1, [el.dataset.name, -1]);
        }
    })
})
// live search
document.querySelector('input[type="search"]').addEventListener('input', (el) => {
    if (el.target.value.length > 2) {
        gettable(el.target.value);
    } else {
        gettable(false);
    }
})
// startup
gettable();