function priSpusteni() {


    // Sem vepis prikazy pro Reda
    // Zde jsou ukazkove prikazy:
    turnLeft()
    turnRight()
    moveForward()

    // Opakuj 5krat
    for (let count = 0; count < 5; count++) {
        // Prikazy, co se maji opakovat, napr:
        turnLeft()
        turnRight()
    }


}
