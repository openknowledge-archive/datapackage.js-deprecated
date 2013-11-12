# datapackage.js

Javascript Node module to manage [Data Packages][dp] especially [Simple
Data Format Data Packages][sdf] with tabular data stored in CSV.

[dp]: http://data.okfn.org/standards/data-package
[sdf]: http://data.okfn.org/standards/simple-data-format

## Installation

[![NPM](https://nodei.co/npm/datapackage.png)](https://nodei.co/npm/datapackage/)

```
npm install datapackage
```

## Tests

    npm test

## Usage

The following assume you've required datapackage as follows:

```
var datapackage = require('datapackage');
```

All callbacks follow the standard node pattern of `(error, data, ...)`.

### Loading and normalizing a datapackage.json

```
datapackage.load(urlToDataPackage, callback)
```

Load a datapackage.json from a URL and normalize it as per the normalize function.

`urlToDataPackage` can be either a url to actual datapackage.json or to a base directory.

### Creating a Data Package datapackage.json (based on source data)

```
datapackage.create(info, callback)
```

`info` is an (optional) hash containing data to use for datapackage info most importantly it can contain a url or resource.url pointing to a data file (CSV). This file will be analyzed and used to create the resource entry in the datapackage.json.

### Validating a Data Package datapackage.json

```
datapackage.validate(rawData)
datapackage.validate(url)
```

Validate a datapackage either provided directly (as a raw string - JSON parse is done in the method) or as a url. This method is synchronous.

Returned object has structure:

```
{
  valid: true | false
  errors: [
    {
      message: ...
      ... possibly other info ...
    },
    {
      ...
    }
  ]
}
```

### Getting a stream

    var stream = datapackage.createReadStream('pathTo/datapackage', datapackage, resourceName, options);


```options```, an object with the following properties:

- objectMode: (true/false) return a stream in objectMode
- coerce: (true/false) coerce the values according to the types specified in schema
- ldjsonify: (true/false) JSON.stringify + '\n'
- foreignkeys: (true/false) take into account foreignkeys

Notes:
```foreignkey``` support for
[SDF](http://dataprotocols.org/simple-data-format/) assumes that the
datapackages have been installed by [npm](https://npmjs.org/doc/) (so
that the package.json files of the dependecies are in
```node_modules/``` (see
[here](https://github.com/isaacs/npm/blob/master/doc/files/npm-folders.md))).


## Changelog

### v0.2.0

* #1 - change to name on fields in resource schemas

