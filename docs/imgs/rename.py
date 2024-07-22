import os

# Define the folder path
folder_path = 'xiaomi'

# List all files in the directory
files = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]

# Initialize the counter
n = 1

# Loop through all the files
for file_name in files:
    # Get the file extension
    file_extension = os.path.splitext(file_name)[1]

    # Create the new file name
    new_file_name = f'xiaomi-{n}{file_extension}'

    # Rename the file
    os.rename(os.path.join(folder_path, file_name), os.path.join(folder_path, new_file_name))

    # Increment the counter
    n += 1

print("Files have been renamed successfully.")
