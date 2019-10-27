import { expect } from "chai";
import * as vscode from "vscode";
import { getSamplesLocation, read, runBetterSearch } from '../helpers';

/**
 * NOTE: Ideally we would want to test every single command with
 * `vscode.commands.executeCommand('commandToTest')` but vscode API lacking the ability to
 * insert text to InputBox prompt, so let's test the functionality with helper function `runBetterSearch` for now.
 */

// TODO: fix tests on unix-based systems (path separators issue)
suite('search', () => {

	// close active editor after each test
	teardown( async () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		}
	});

	test('should show error if query is empty or undefined', done => {
		runBetterSearch({ query: '' })
			.then(() => done('failed'))
			.catch(() => done());
	});

	test('should work but find no results', async () => {
		const location = getSamplesLocation('search/wrong-folder');
		const expected = read('search/results/expected-no-results.txt');
		const result = await runBetterSearch({ query: 'foo', location });
		expect(result).to.equal(expected);
	});

	test('should work with multiple extensions', async () => {
		const location = getSamplesLocation('search');
		const expected = read('search/results/expected-multiple-extensions.txt');
		const result = await runBetterSearch({ query: 'foo', location });
		expect(result).to.equal(expected);
	});

	test('should work with single extension', async () => {
		const location = getSamplesLocation('search/js');
		const expected = read('search/results/expected-single-extension.txt');
		const result = await runBetterSearch({ query: 'foo', location });
		expect(result).to.equal(expected);
	});

	test('should work with regex query', async () => {
		const location = getSamplesLocation('search');
		const expected = read('search/results/expected-regex-query.txt');
		const result = await runBetterSearch({ query: 'foo|bar|Baz', location, queryRegex: true });
		expect(result).to.equal(expected);
	});

	test('should work with context option set to 0', async () => {
		const location = getSamplesLocation('search');
		const expected = read('search/results/expected-context-0.txt');
		const result = await runBetterSearch({ query: 'foo|bar|Baz', location, queryRegex: true, context: 0 });
		expect(result).to.equal(expected);
	});

	test('should work with context option set to 5', async () => {
		const location = getSamplesLocation('search');
		const expected = read('search/results/expected-context-5.txt');
		const result = await runBetterSearch({ query: 'foo', location, context: 5 });
		expect(result).to.equal(expected);
	});
});