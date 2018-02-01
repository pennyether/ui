#!/usr/bin/env node

/**
Usage: ./copy_test_results.js path/to/test/results

Copies path/to/test/results/* to ../dist/test-results/*
It templatizes the index.html file so that it looks nicer.
*/
const fs = require('fs');
const path = require('path');
const outputDir = path.join(__dirname, "../dist/test-results");
if (!fs.existsSync(outputDir)){
	console.log(`Creating output directory: ${outputDir}`);
	fs.mkdirSync(outputDir)
} else if (!fs.lstatSync(outputDir).isDirectory()){
	console.log(`Output directory is not a folder: ${outputDir}`);
}

const inputDir = process.argv[2];
if (!inputDir){
    throw new Error(`Please provide the input directory, eg: /path/to/pennyether-contracts/test/results`);
}
if (!fs.existsSync(inputDir) || !fs.lstatSync(inputDir).isDirectory()){
    throw new Error(`Unable to find input directory: ${inputDir}`);
}

//copy all files
(function copyAllFiles(){
	const files = fs.readdirSync(inputDir);
	files.forEach((filename)=>{
		const from = path.join(inputDir, filename);
		const to = path.join(outputDir, filename);
		console.log(`Copying ${filename}...`);
		fs.writeFileSync(to, fs.readFileSync(from));
	});
}());

(function modifyIndex(){
	const indexFilepath = path.join(outputDir, "index.html");
	if (!fs.existsSync(indexFilepath) || fs.lstatSync(indexFilepath).isDirectory()){
	    throw new Error(`Unable to find index.html: ${indexFilepath}`);
	}
	const contents = fs.readFileSync(indexFilepath);
	const bodyContents = (/<body[^>]*>((.|[\n\r])*)<\/body>/im).exec(contents)[1];
	const html = `
		<!DOCTYPE html>
		<html>
			<head>
				<script src="/javascripts/lib/Loader.js"></script>
			</head>
			<body><div id="Content">
				<div class="pageTitle">
					Test Results
				</div>
				<div style="text-align: center;">
					<div style="display: inline-block; text-align: left;">
						${bodyContents}
					</div>
				</div>
			</div></body>
		</html>
	`;
	fs.writeFileSync(indexFilepath, html);
	console.log(`Updated index.html.`);
}());
console.log(`Done.`);