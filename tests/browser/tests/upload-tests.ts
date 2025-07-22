/**
 * Upload Tests for AudioTricks
 * Tests file upload functionality
 * CLAUDE.md compliant - Under 250 lines
 */

import { Page } from 'puppeteer';
import { TestHelpers } from '../utils/test-helpers';
import path from 'path';

export class UploadTests {
  private page: Page;
  private helpers: TestHelpers;

  constructor(page: Page, helpers: TestHelpers) {
    this.page = page;
    this.helpers = helpers;
  }

  /**
   * Test: Upload functionality (if exists)
   */
  async testUploadFunctionality(): Promise<void> {
    // Look for file upload elements
    const fileInputs = await this.page.$$('input[type="file"]');
    
    if (fileInputs.length === 0) {
      console.log('No file upload inputs found');
      return;
    }
    
    console.log(`Found ${fileInputs.length} file upload inputs`);
    
    // Create a test file
    const testFilePath = await this.helpers.createTestFile(
      'test-audio.mp3',
      Buffer.from('fake mp3 content for testing').toString()
    );
    
    try {
      for (let i = 0; i < fileInputs.length; i++) {
        const input = fileInputs[i];
        console.log(`  Testing file upload ${i + 1}`);
        
        await input.uploadFile(testFilePath);
        await this.page.waitForTimeout(2000);
        
        // Take screenshot after file selection
        await this.helpers.takeScreenshot(`upload-${i + 1}-selected`);
        
        // Look for upload button or submit
        const uploadButton = await this.page.$('button:has-text("Upload"), button:has-text("Process"), input[type="submit"]');
        if (uploadButton) {
          await uploadButton.click();
          await this.page.waitForTimeout(5000); // Wait longer for upload processing
          await this.helpers.takeScreenshot(`upload-${i + 1}-processing`);
        }
      }
    } finally {
      // Clean up test file
      await this.helpers.cleanupTestFile(testFilePath);
    }
  }

  /**
   * Test: Drag and drop upload
   */
  async testDragAndDropUpload(): Promise<void> {
    // Look for dropzone elements
    const dropzones = await this.page.$$(
      '.dropzone, [data-testid*="dropzone"], [aria-label*="drop"], .file-drop-area'
    );
    
    if (dropzones.length === 0) {
      console.log('No drag-and-drop zones found');
      return;
    }
    
    console.log(`Found ${dropzones.length} dropzone(s)`);
    
    for (let i = 0; i < dropzones.length; i++) {
      try {
        const dropzone = dropzones[i];
        
        // Get dropzone position
        const box = await dropzone.boundingBox();
        if (!box) continue;
        
        // Simulate drag over
        await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await this.page.waitForTimeout(500);
        
        // Check if dropzone shows hover state
        const hasHoverState = await dropzone.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
                 el.classList.toString().includes('hover') ||
                 el.classList.toString().includes('active');
        });
        
        if (hasHoverState) {
          console.log(`  Dropzone ${i + 1} shows hover state`);
          await this.helpers.takeScreenshot(`dropzone-${i + 1}-hover`);
        }
        
      } catch (error) {
        console.log(`  Error testing dropzone ${i + 1}: ${error.message}`);
      }
    }
  }

  /**
   * Test: Multiple file upload
   */
  async testMultipleFileUpload(): Promise<void> {
    // Look for multiple file upload inputs
    const multipleInputs = await this.page.$$('input[type="file"][multiple]');
    
    if (multipleInputs.length === 0) {
      console.log('No multiple file upload inputs found');
      return;
    }
    
    console.log(`Found ${multipleInputs.length} multiple file upload input(s)`);
    
    // Create multiple test files
    const testFiles = [];
    for (let i = 1; i <= 3; i++) {
      const filePath = await this.helpers.createTestFile(
        `test-audio-${i}.mp3`,
        Buffer.from(`fake mp3 content ${i}`).toString()
      );
      testFiles.push(filePath);
    }
    
    try {
      for (const input of multipleInputs) {
        console.log('  Testing multiple file upload');
        
        // Upload multiple files
        await input.uploadFile(...testFiles);
        await this.page.waitForTimeout(2000);
        
        // Check if files are listed
        const fileList = await this.page.$$('.file-list, .uploaded-files, [data-testid*="file-list"]');
        if (fileList.length > 0) {
          console.log('    Multiple files appear to be uploaded');
          await this.helpers.takeScreenshot('multiple-files-uploaded');
        }
      }
    } finally {
      // Clean up test files
      for (const file of testFiles) {
        await this.helpers.cleanupTestFile(file);
      }
    }
  }

  /**
   * Test: File type validation
   */
  async testFileTypeValidation(): Promise<void> {
    const fileInputs = await this.page.$$('input[type="file"]');
    
    for (let i = 0; i < Math.min(fileInputs.length, 2); i++) {
      const input = fileInputs[i];
      
      // Check accept attribute
      const acceptTypes = await input.evaluate(el => el.getAttribute('accept'));
      if (!acceptTypes) continue;
      
      console.log(`  File input ${i + 1} accepts: ${acceptTypes}`);
      
      // Create test file with wrong extension
      const wrongFilePath = await this.helpers.createTestFile(
        'test-document.pdf',
        Buffer.from('fake pdf content').toString()
      );
      
      try {
        await input.uploadFile(wrongFilePath);
        await this.page.waitForTimeout(1000);
        
        // Look for validation error
        const errorMessages = await this.page.$$(
          '.error, .file-error, [data-testid*="error"], :has-text("Invalid file type")'
        );
        
        if (errorMessages.length > 0) {
          console.log('    File type validation working correctly');
          await this.helpers.takeScreenshot(`file-type-validation-${i + 1}`);
        }
      } finally {
        await this.helpers.cleanupTestFile(wrongFilePath);
      }
    }
  }
}