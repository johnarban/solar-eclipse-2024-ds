"""
This script simplifies a list of CSV files containing latitude, longitude, and cloud cover data.
It removes the latitude and longitude columns, keeps only the cloud cover column, and outputs the cloud cover data to each file.
Additionally, it extracts the latitude and longitude values from the first file and outputs them to a separate file called 'coords.csv'.
"""

import glob
import numpy as np

# get the list of files
files = glob.glob('*_cloud_cover.csv')

# loop through the files
for i, file in enumerate(files):
    # read in the file
    data = np.genfromtxt(file, delimiter=',', skip_header=1)
    if i == 0:
        lats = data[:, 0]
        lons = data[:, 1]
    cloud_cover = data[:, 2]
    # write out the cloud cover
    np.savetxt(file, cloud_cover, delimiter=',', fmt='%0.3f')

# write out the lat lons
np.savetxt('coords.csv', np.column_stack((lats, lons)), delimiter=',', fmt='%0.2f')
