//generates a list of matched pairs of people -> first person in one set is the assassin and the second person is the target

function match(studentArray){

    for (let i = studentArray.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
        [studentArray[i], studentArray[j]] = [studentArray[j], studentArray[i]]; // swap elements
    }
    let matchedPairs = {};

    for (let i = 0; i < studentArray.length - 1; i++) {
        matchedPairs[studentArray[i]] = studentArray[i+1];
    }
    matchedPairs[studentArray[studentArray.length-1]] = studentArray[0];

    return matchedPairs;
}
