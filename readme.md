# Machine-actionable data descriptions for Austria's digital landscape model


The digital landscape model (DLM) is a compilation of several data sets that, among other things, form the data basis for official maps. It covers a variety of the 34 themes of the EU directive INSPIRE. The introduction of these themes enriched the metadata and made similar datasets easier to find. Unfortunately, the competent authority (BEV) only provides the associated data descriptions as a PDF export of an Excel spreadsheet without translations.


The merged cells make an extraction rather difficult. A detailed explanation can be read in [pdf2tree](https://github.com/jogemu/pdf2tree), which I created for this purpose. The source code is separted to simplify reuse. The schema of the resulting data can be found in `datadescription.schema.json`.


## Setup

The scripts are executed in a specified order. The names of the files are chosen so that they start with the number of the steps.

Install Node.js and use the command `npm install` inside this project to download the dependencies.


## Step 0

`00fetchMetadata.js` will download the metadata xml files of the sources specified in `sources.json` and put them into `sources/metadata/`.


## Step 1

`01adjustMetadata.js` extracts the relevant fields from the metadata downloaded in Step 0 and adds ANNEX information that is downloaded from the INSPIRE Registry. The information is stored in `sources/adjusted/`.


## Step 2

`02fetchDescriptions.js` downloads the data description PDFs that were extracted in Step 1 into `sources/descriptions/`.


## Step 3

`03generate.js` extracts the data from the PDFs and structures them as specified in `datadescription.schema.json` and stores the result in `out/`. These files are the end result of the application.


## Step 4 (optional)

Do not execute `04validate.js` without downloading the gpkg files first. The links stored in `sources.json` list the file but you can also use the links that are stored in the property `gpkg` of the json files in `sources/adjusted`. Download the right gpkg file into `sources/gpkg` and then specify the file you want to validate in `04validate.js`. Then the program will check if the results are consistent with the db and will log errors in the console.


## Step 5 (optional)

`05stats.js` creates some basic statistics and stores them in a csv file. This is used to generate diagrams in an external program.