#!/usr/bin/env python3
import os
import re
import glob

def fix_imports_in_file(file_path):
    """Fix imports in a single Java file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix package declarations
        content = re.sub(
            r'package com\.z7design\.secured_guard\.([^;]+);',
            r'package br.com.fleetmanager.\1;',
            content
        )
        
        # Fix import statements
        content = re.sub(
            r'import com\.z7design\.secured_guard\.([^;]+);',
            r'import br.com.fleetmanager.\1;',
            content
        )
        
        # Only write if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {file_path}")
            return True
        return False
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main function to fix all Java files"""
    java_files = glob.glob("src/main/java/**/*.java", recursive=True)
    
    fixed_count = 0
    total_count = len(java_files)
    
    print(f"Found {total_count} Java files to check...")
    
    for java_file in java_files:
        if fix_imports_in_file(java_file):
            fixed_count += 1
    
    print(f"\nCompleted! Fixed {fixed_count} out of {total_count} files.")

if __name__ == "__main__":
    main()
