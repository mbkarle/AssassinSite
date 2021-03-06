class InternalNotification {
    constructor(title, message, buttons, data){
       this.title = title;
       this.message = message;
       this.buttons = buttons;
       this.data = data || {};
       var buttonDivs = "";
       var id = (Object.keys(this.data).length > 0)?"data-info='"+JSON.stringify(data)+"'" : '';
       for(var button of buttons){
           buttonDivs += "<button "+id+" class='modal-button "+button+"'>"+button+"</button>";
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

    updateMessage(message){
        this.message = message;
        this.dbStore.message = message;
    }

}
