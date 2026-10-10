# imports

from random import shuffle, randrange
from pandas import read_csv

# data imports

data = read_csv(r'startrekdata.csv')
questions = data['Question'].tolist()
answers = data['Answer'].tolist()
alternate1 = data['Alternate1'].tolist()
alternate2 = data['Alternate2'].tolist()
alternate3 = data['Alternate3'].tolist()

# producing

ABCD = ["A", "B", "C", "D"]

def set():
    pick = randrange(len(questions))
    q = questions.pop(pick)
    a0 = answers.pop(pick)
    a1 = alternate1.pop(pick)
    a2 = alternate2.pop(pick)
    a3 = alternate3.pop(pick)
    choices = [a0, a1, a2, a3]
    shuffle(choices)
    r = choices.index(a0)

    global frame
    frame = [q, choices, r]

def pose():
    print(frame[0])
    for i in range(4):
        print(ABCD[i] + ": " + frame[1][i])
    response = input("Response: ")
    if response == ABCD[frame[2]]:
        print("Correct!")
    else:
        print("Incorrect.")

while len(questions) > 0:
    set()
    pose()
    print("\n")
