// let array = ['Matt Damon', 'Phil Swift', 'Benjamin Franklin', 'Timmy Kwan', 'Barack Obama', 'Banana Jones', 'Evan Malkin', 'Iron Man'];


//generates a list of matched pairs of people -> first person in one set is the assassin and the second person is the target
function match(studentArray){

    for(let i=0; i < studentArray.length*2; i++){
        let randIndex1 = parseInt(Math.random()*studentArray.length, 10);
        let randIndex2 = parseInt(Math.random()*studentArray.length, 10);

        if(randIndex1 == randIndex2){
            randIndex2 = parseInt(Math.random()*studentArray.length, 10);
        }

        let temp = studentArray[randIndex2];
        studentArray[randIndex2] = studentArray[randIndex1];
        studentArray[randIndex1] = temp;
    }

    let matchedPairs = [];

    for (let i = 0; i < studentArray.length - 1; i++) {
        matchedPairs.push([studentArray[i], studentArray[i+1]])
    }
    matchedPairs.push([studentArray[studentArray.length - 1], studentArray[0]]);

    // console.log(matchedPairs.join('|'));
    return matchedPairs;
}

// match(array);
