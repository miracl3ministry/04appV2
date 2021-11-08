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
        this.replaseMap.set('Полка', 'shelf');
    }
    read(path) {
        const workSheetsFromFile = xlsx.parse(path);
        return workSheetsFromFile;
    }
    write(filename, data) {
        let arr = [];
        arr[0] = Object.keys(data[0]);
        for (let i = 1; i < data.length; i++) {
            arr[i] = Object.values(data[i]);
        }
        let buffer = xlsx.build([{name: "Лист1", data: arr}]);
        fs.writeFile(filename, buffer, e => {
            if (!e) console.log("xlsx module says: Saved");
            else console.log(e.message);
        });
    }
    start(filename = "Книга2.xlsx", setID = null) {
        let res = this.read(`${__dirname}\\${filename}`);
        console.log(res);
        let arr = res[0].data;
        let newArr = [];
        let replaceMap2 = new Map();
        /* Создает map для подстановки из индекса в объект. Имеет такой вид:
        Map(6) {
            '3' => 'code',
            '4' => 'modificationCode',
            '5' => 'name',
            '7' => 'price',
            '10' => 'count',
            '13' => 'manufacturer'
        }
        */
        for (let key in arr[0]) {
            if (this.replaseMap.has(arr[0][key])){
                replaceMap2.set(key, this.replaseMap.get(arr[0][key]));
            }
        }
        for (let i = 1; i < arr.length; i++) {
            let obj = {};
            if (Number.isInteger(setID)) {
                obj.id = setID;
                setID++;
            }
            for (let key of replaceMap2) {
                obj[key[1]] = arr[i][key[0]];
            }
            newArr.push(obj)
        }
        return newArr;
    }
}
module.exports = Csv;