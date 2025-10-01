import os
import re

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Fix package declarations
        content = re.sub(r'package com\.z7design\.secured_guard\.([^;]+);', r'package br.com.fleetmanager.\1;', content)
        
        # Fix import statements
        content = re.sub(r'import com\.z7design\.secured_guard\.([^;]+);', r'import br.com.fleetmanager.\1;', content)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {filepath}")
            return True
        return False
    except Exception as e:
        print(f"Error: {filepath} - {e}")
        return False

# Fix all Java files
fixed_count = 0
for root, dirs, files in os.walk('src/main/java'):
    for file in files:
        if file.endswith('.java'):
            filepath = os.path.join(root, file)
            if fix_file(filepath):
                fixed_count += 1

print(f"Total files fixed: {fixed_count}")
