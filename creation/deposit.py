from random import shuffle, randrange
from pandas import read_csv

data = read_csv(r'startrekdata.csv').fillna(value='null')
questions = data['Question'].tolist()
answers = data['Answer'].tolist()
alternate1 = data['Alternate1'].tolist()
alternate2 = data['Alternate2'].tolist()
alternate3 = data['Alternate3'].tolist()
difficulty = data['Difficulty'].tolist()
source = data['Source'].tolist()
verified = data['Verified'].tolist()

f = open('../assets/vault.js', 'w')
f.write('const vault = { \n');
f.write('questions: '+ str(questions) + ', \n')
f.write('answers: '+ str(answers) + ', \n')
f.write('alternates1: '+ str(alternate1) + ', \n')
f.write('alternates2: '+ str(alternate2) + ', \n')
f.write('alternates3: '+ str(alternate3) + ', \n')
f.write('difficulty: '+ str(difficulty) + ', \n')
f.write('source: ' + str(source) + ', \n')
f.write('verified: ' + str(verified))
f.write('\n};')
f.close()
