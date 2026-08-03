import test from 'node:test';
import assert from 'node:assert/strict';
import { getFileCategory, getOrganizableCategory, isOrganizableFile, isProtectedSystemItem, isTransientFile } from '../src/shared/file-categories';

test('maps supported extensions to categories', () => {
  assert.equal(getFileCategory('report.PDF'), 'documents');
  assert.equal(getFileCategory('photo.webp'), 'images');
  assert.equal(getFileCategory('movie.mkv'), 'videos');
  assert.equal(getFileCategory('setup.msi'), 'installers');
  assert.equal(getFileCategory('backup.7z'), 'archives');
  assert.equal(getFileCategory('Browser.lnk'), 'shortcuts');
  assert.equal(getFileCategory('Published.appref-ms'), 'shortcuts');
  assert.equal(getFileCategory('Legacy.pif'), 'shortcuts');
});

test('leaves unknown and temporary files alone', () => {
  assert.equal(getFileCategory('source.ts'), 'other');
  assert.equal(isOrganizableFile('source.ts'), false);
  assert.equal(isTransientFile('download.crdownload'), true);
  assert.equal(isOrganizableFile('download.crdownload'), false);
});

test('applies folder and shortcut rules independently', () => {
  const disabled = { scanExistingOnAutomaticEnable: true, includeFolders: false, includeShortcuts: false };
  const enabled = { scanExistingOnAutomaticEnable: true, includeFolders: true, includeShortcuts: true };
  assert.equal(getOrganizableCategory('Project', 'directory', disabled), 'other');
  assert.equal(getOrganizableCategory('Project', 'directory', enabled), 'folders');
  assert.equal(getOrganizableCategory('Browser.lnk', 'file', disabled), 'other');
  assert.equal(getOrganizableCategory('Browser.lnk', 'file', enabled), 'shortcuts');
});

test('protects Windows system desktop metadata', () => {
  assert.equal(isProtectedSystemItem('desktop.ini'), true);
  assert.equal(isProtectedSystemItem('THUMBS.DB'), true);
  assert.equal(isProtectedSystemItem('notes.ini'), false);
});
