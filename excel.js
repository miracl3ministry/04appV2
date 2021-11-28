const fs = require('fs');
const xlsx = require('node-xlsx');

class Csv {
    static instance;
    constructor() {
        if (Csv.instance) {
            return Csv.instance;
        }
        Csv.instance = this;
        this.replaseMap = new Map();
        this.replaseMap.set('ИД', 'id');
        this.replaseMap.set('Имя товара', 'name');
        this.replaseMap.set('Производитель', 'manufacturer');
        this.replaseMap.set('Артикул', 'code');
        this.replaseMap.set('Артикул модификации', 'modificationCode');
        this.replaseMap.set('Модель', 'model');
        this.replaseMap.set('Цена', 'price');
        this.replaseMap.set('Количество', 'count');
        this.replaseMap.set('Стеллаж', 'rack');
        this.replaseMap.set('Склад', 'warehouse');
        this.replaseMap.set('Полка', 'shelf');
        this.replaseMap.set('Описание', 'description');
        this.replaseMap.set('Характеристики', 'specifications');
    }

    async read(path) { /* прасит xlsx и возвращает листы */
        const workSheetsFromFile = await xlsx.parse(path);
        return workSheetsFromFile;
    }
    async write(path, data, callback) { /* записывает файл */
        let arr = [];
        arr[0] = Array.from(this.replaseMap, ([name]) => name);
        for (let i = 0; i < data.length; i++) {
            arr[i+1] = [];
            this.replaseMap.forEach((val) => {
                arr[i+1].push(data[i][val] ?? '');
            })
        }
        let buffer = xlsx.build([{name: "Лист1", data: arr}]);
        fs.writeFile(path, buffer, (e, res) => {
            if (!e) {
                console.log("xlsx module: Saved", res);
                callback(null, path);
            } else {
                console.log(e.message)
                callback(e);
            }
        });
    }
    string2num(str = "") {
        str = str
            .replaceAll(',', '.')
            .replaceAll(" ", "")
            .replaceAll(' ', '');
        let num;
        try {
            num = Number(str);
        } catch (e) {
            console.error(e);
            return str;
        }
        return num;
    }
    async start(path = "Книга1.xlsx", setID = null) {
        /* парсит таблицу и возвращает массив объектов */
        console.log('xlsx module: ', path);
        let res = await this.read(path);
        let arr = res[0].data;
        let newArr = [];
        let replaceMap2 = new Map();
        for (let key in arr[0]) {
            if (this.replaseMap.has(arr[0][key])) {
                replaceMap2.set(key, this.replaseMap.get(arr[0][key]));
            }
        }
        /* Создает map для подстановки из индекса в объект. Имеет примерно такой вид:
        Map(7) {
          '3' => 'code',
          '4' => 'modificationCode',
          '5' => 'name',
          '7' => 'price',
          '10' => 'count',
          '11' => 'description',
          '13' => 'manufacturer'
        }
        */
        for (let i = 1; i < arr.length; i++) {
            let obj = {};
            if (Number.isInteger(setID)) {
                obj.id = setID;
                setID++;
            }
            for (let key of replaceMap2) {
                obj[key[1]] = arr[i][key[0]];
            }
            if (obj['count']) {
                obj['count'] = this.string2num(obj['count']);
            }
            if (obj['price']) {
                obj['price'] = this.string2num(obj['price']);
            }
            newArr.push(obj)
        }
        return newArr;
    }
}

module.exports = Csv;