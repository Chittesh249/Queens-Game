from fastapi import FastAPI

app=FastAPI()



@app.post("/validate")  #validate's the player's board
def function_name():
    return




@app.get("/solve")  #Returns N-Queen solution
def function_name():
    return    



@app.post("/check-position")  # For Ui placement checking
def function_name():
    return



@app.post("/step-solve")  # For visualizing backtracking
def function_name():
    return


@app.post("/save")  #Saving game state
def function_name():
    return



