class InternalNotification {
    constructor(title, message, buttons, data){
       this.title = title;
       this.message = message;
       this.buttons = buttons;
       this.data = data || {};
       var buttonDivs = "";
       var gameID = ('gameId' in this.data)?"id='"+data.gameId+"'" : '';
       for(var button of buttons){
           buttonDivs += "<button "+gameID+" class='modal-button "+button+"'>"+button+"</button>";
       }
       this.modal_items = [
            {
                type: "h1",
                classes: [],
                content: this.title
            },
            {
                type: 'div',
                classes: ['rounded-container', 'info-title'],
                content: this.message
            },
            {
                type: 'div',
                classes: ['internal-row'],
                content: buttonDivs
            }

       ];
       this.dbStore = {
           title: this.title,
           message: this.message,
           buttons: this.buttons,
           data: this.data
       };
    }

}
