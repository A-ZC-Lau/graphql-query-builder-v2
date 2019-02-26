"use strict";

//=====================================================
//============================ parce properties to find
//=====================================================

function parceFind(_levelA) {

//+++++++++++++++++++++++++++++++++++ work over Array
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    let propsA = _levelA.map(function(currentValue, index) {

        let itemX = _levelA[index];

        if (itemX instanceof Query) {
            return itemX.toString();
        } else if (!Array.isArray(itemX) && "object" === typeof itemX) {
            let propsA = Object.keys(itemX);
            if (1 !== propsA.length) {
                throw new RangeError("Alias objects should only have one value. was passed: " + JSON.stringify(itemX));
            }
            let propS = propsA[0];
            let item = itemX[propS];
            // contributor: https://github.com/charlierudolph/graphql-query-builder/commit/878328e857e92d140f5ba6f7cfe07837620ec490
            if (Array.isArray(item)) {
                return new Query(propS).find(item)
            }
            return `${propS} : ${item} `;
        } else if ("string" === typeof itemX) {
            return itemX;
        } else {
            throw new RangeError("cannot handle Find value of " + itemX);
        }
    });

    return propsA.join(",");
}

//=====================================================
//=================================== get GraphQL Value
//=====================================================

function getGraphQLValue(value) {
    if ("string" === typeof value || value === null || value === undefined) {
        value = JSON.stringify(value);
    } else if (Array.isArray(value)) {
        value = value.map(item => {
            return getGraphQLValue(item);
        }).join();
        value = `[${value}]`;
    } else if ("object" === typeof value) {
        /*if (value.toSource)
              value = value.toSource().slice(2,-2);
          else*/
        value = objectToString(value);
        //console.error("No toSource!!",value);
    }
    return value;
}

function objectToString(obj) {
    if (obj instanceof Query.EnumValue) {
        return obj.value;
    }

    let sourceA = [];

    for (let prop in obj) {
        if ("function" === typeof obj[prop]) {
            continue;
        }
        // if ("object" === typeof obj[prop]) {
        sourceA.push(`${prop}:${getGraphQLValue(obj[prop])}`);
        // } else {
        //      sourceA.push(`${prop}:${obj[prop]}`);
        // }
    }
    return `{${sourceA.join()}}`;
}


//=====================================================
//========================================= Query Class
//=====================================================

function Query(_fnNameS, _aliasS_OR_Filter) {

    this.fnNameS = _fnNameS;
    this.headA = [];

    this.filter = (filtersO) => {
        for (let propS in filtersO) {
            if ("function" === typeof filtersO[propS]) {
                continue;
            }
            let val = getGraphQLValue(filtersO[propS]);

            if ("{}" === val) {
                continue;
            }
            this.headA.push(`${propS}:${val}`);
        }
        return this;
    };

    if ("string" === typeof _aliasS_OR_Filter) {
        this.aliasS = _aliasS_OR_Filter;
    } else if ("object" === typeof _aliasS_OR_Filter) {
        this.filter(_aliasS_OR_Filter);
    } else if (undefined === _aliasS_OR_Filter && 2 === arguments.length) {
        throw new TypeError("You have passed undefined as Second argument to 'Query'");
    } else if (undefined !== _aliasS_OR_Filter) {
        throw new TypeError("Second argument to 'Query' should be an alias name(String) or filter arguments(Object). was passed " + _aliasS_OR_Filter);
    }

    this.setAlias = (_aliasS) => {
        this.aliasS = _aliasS;
        return this;
    };

    this.find = function(findA) { // THIS NEED TO BE A "FUNCTION" to scope 'arguments'
        if (!findA) {
            throw new TypeError("find value can not be >>falsy<<");
        }
        // if its a string.. it may have other values
        // else it sould be an Object or Array of maped values
        this.bodyS = parceFind((Array.isArray(findA)) ? findA : Array.from(arguments));
        return this;
    };
}

//=====================================================
//===================================== Query prototype
//=====================================================

Query.prototype = {

    toString: function() {
        // if (undefined === this.bodyS) {
        //     throw new ReferenceError("return properties are not defined. use the 'find' function to defined them");
        // }

        let alias =
            (this.aliasS)
                ? (this.aliasS + ":")
                : ""
        let fnNameS =
            this.fnNameS
        let part2 =
            (0 < this.headA.length)
                ? `( ${this.headA.join(",")} )`
                : ""
        // console.log(this.headA)
        // console.log(this.bodyS)
        let part3 =
            this.bodyS
                ? `{ ${this.bodyS} }`
                : ""

        return `${alias} ${fnNameS} ${part2} ${part3}`;
        // return `${ (this.aliasS) ? (this.aliasS + ":") : "" } ${this.fnNameS } ${ (0 < this.headA.length)?"("+this.headA.join(",")+")":"" }  { ${ this.bodyS } }`;
    }
};

//=====================================================
//========================================= Enum Class
//=====================================================

Query.EnumValue = function EnumValue(value) {
    if (!value) {
        throw new TypeError("enum value can not be >>falsy<<")
    }

    this.value = value;
};

Query.Enum = function Enum(value) {
    return new Query.EnumValue(value);
};

module.exports = Query;
