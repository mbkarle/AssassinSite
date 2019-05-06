var modalContent = {
    "Create Game": [
        {
            type:'h1',
            classes: [],
            content: "Create Game"
        },
        {
            type:'input',
            classes: ['gameNameInp'],//todo
            content: "Game Name"
        },
        {
            type: 'div',
            classes: ['modal-container'],
            content: '<h3 class="contained-inp cont-label">Start Date</h3><h3 class="contained-inp cont-label">End Date</h3>'
        },
        {
            type: 'div',
            classes: ['modal-container'],
            content: '<input id="startD" class="contained-inp" type="date"><input id="endD" class="contained-inp" type="date">'
        },
        {
            type: 'input',
            classes: ['locationInp'],
            content: 'Game Location'
        },
        {
            type: 'div',
            classes: ['modal-container'],
            content: '<input class="killInterval" placeholder="Kill interval? # of Days" type="number" min="1" max="365">'
        },
        {
            type: 'textarea',
            classes: ['tall-input', 'gameDescription'],
            content: 'Description or unique rules'
        },
        {
            type: 'input',
            classes:['userRestrict'],
            content: 'Regulate user domain? @example.com'
        },
        {
            type: 'input',
            classes: ['gamePass'],
            content: 'Add game password?'
        },
        {
            type: 'button',
            classes: ['modal-createB'],
            content: "Create"
        }
    ],

    'Add Safeties': [
        {
            type: 'h1',
            classes: [],
            content: 'Add Safeties'
        },
        {
            type: 'div',
            classes: ['addSafeties'],
            content: '<input class="addSafety" placeholder="Add a safety item">'
        },
        {
            type: 'button',
            classes: ['addMoreSafeties', 'stackedButton'],
            content: 'Add another item'
        },
        {
            type: 'button',
            classes: ['completeSafeties', 'stackedButton'],
            content: 'Save safety items'
        }

    ]

}
