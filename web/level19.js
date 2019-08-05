function priSpusteni() {


    // Sem vepis prikazy pro Reda
    // Zde jsou ukazkove prikazy:
    turnLeft();
    turnRight();
    moveForward();

    // Opakuj dokud (podminka)
    // Mozne podminky:
    //      notFinished()
    //      isPathLeft()
    //      isPathRight()
    //      isPathForward()
    while (notFinished()) {
        // Provadej tyto prikazy
        turnRight();
    }

    if (isPathLeft()) {
        // Proved prikazy zde, jen pokud plati podminka isPathLeft() 
    } else {
        // Jinak proved prikazy zde
    }

}
