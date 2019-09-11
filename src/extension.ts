'use strict';

import * as vscode from 'vscode';


export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('gitSearch.searchSelected', () => {
		const editor = vscode.window.activeTextEditor;
		if(! editor) {
			vscode.window.showErrorMessage("No text selected");
			return false;
		}


		var terminal = vscode.window.createTerminal( "git search"); 

		terminal.sendText(getSearchCommand(editor));
		terminal.show(true);
	}));
}


function getSearchCommand(editor: vscode.TextEditor): string {


	const selection =  editor.selection;

	const path = editor.document.fileName.replace(/^[a-z]/, c => c.toUpperCase());
	if(selection.isSingleLine) {
		const text = selection.isEmpty ? extractALlFirstLineText(editor, selection) : getText(editor, selection);
		return `git log -S '${ escapeText(text) }' -- "${path}"`;
	}
	else {
		return  `git log -L '/${ extractFirstLineText(editor, selection) }/,/${ extractLastLineText(editor, selection) }/:${path}'`;
	}


}


var escapeText = (text: string) => text.replace(/"/g, '\\"').replace(/'/g, '\\\'')
var escapeRegExp = (text: string) => escapeText( text.replace(/[[\]\/]/g, '\\$&') );


function extractFirstLineText(editor: vscode.TextEditor, selection: vscode.Selection): string {
	try {
		return escapeRegExp( getText(editor, extractFirstLine(editor, selection) ) );
	}
	catch(e) {
		vscode.window.showErrorMessage(e);

		return "first line of the block";
	}
}

function extractALlFirstLineText(editor: vscode.TextEditor, selection: vscode.Selection): string {
	const firstLineFromCursor = extractFirstLine(editor, selection);
	try {
		const allFirstLine = firstLineFromCursor.with( firstLineFromCursor.start.with({ character: 0}) );

		return escapeRegExp( getText(editor, allFirstLine) );
	}
	catch(e) {
		vscode.window.showErrorMessage(e);

		return escapeRegExp( getText(editor, firstLineFromCursor) )
	}
}

function extractFirstLine(editor: vscode.TextEditor, selection: vscode.Selection): vscode.Range {
		const firstAndSecondLine = selection.with({ end: selection.start.with(selection.start.line +1, 0) });
		const textFirstAndSecondLine = getText(editor, firstAndSecondLine);
		let indexLastCharFirstLine =  selection.start.character + textFirstAndSecondLine.length -1;


		return selection.with({end: selection.start.with(selection.start.line, indexLastCharFirstLine) });
}

function extractLastLine(editor: vscode.TextEditor, selection: vscode.Selection): vscode.Range {
	return selection.with({ start: selection.end.with(selection.end.line, 0) });
}

function extractLastLineText(editor: vscode.TextEditor, selection: vscode.Selection): string {
	try {
		return escapeRegExp( getText(editor, extractLastLine(editor, selection) ) );
	}
	catch(e) {
		vscode.window.showErrorMessage(e);

		return "last line of the block";
	}
}

function getText(editor: vscode.TextEditor, selection: vscode.Range | vscode.Selection): string {
	return editor.document.getText(selection).trim();
}

