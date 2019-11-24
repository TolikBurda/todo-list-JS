const uuid =()=>([1e7]+-1e3+-4e3+-8e3+-1e11)
    .replace(/[018]/g,c=>(c^crypto
    .getRandomValues(new Uint8Array(1))[0]&15 >> c/4)
    .toString(16));

class Component {
    constructor() {
        this.element = null;
    }

    render(){

    }
}

class TodoAppComponent extends Component{
    constructor() {
        super();
        this.pubsub = new PubSub();
        this.element = document.createElement('div');
        this.todoService = new TodoService(this.pubsub);
        this.form = new TodoFormComponent(this.pubsub);
        this.todoList = new TodoListComponent(this.pubsub);
        this.confirmModal = new ConfirmModal(this.pubsub);

        this.idTodo_ToDelete = null;

        this.title = 'My 2Do';
        document.getElementsByTagName('header')[0].innerHTML = this.title;

        this.render();

        this.pubsub.subscribe('onCreate', this, this.createTodo); //from form
        this.pubsub.subscribe('handleDelete', this, this.handleDelete); //from todoItem
        this.pubsub.subscribe('delete', this, this.deleteTodo); //from confirmModal
        this.pubsub.subscribe('cancelDelete', this, this.cancelDelete);//from confirmModal
        this.pubsub.subscribe('toggle', this, this.toggleTodo); //from todoItem
        this.pubsub.subscribe('edit', this, this.editTodo); //from todoItem
    }

    render(){
        this.element.innerHTML = '';
        this.element.append(this.confirmModal.render());
        this.element.append(this.form.element);
        this.element.append(this.todoList.element);
    }

    createTodo(title) {
        if(title){
            this.todoService.createTodo(title);
        }
    }

    handleDelete(id) {
        this.idTodo_ToDelete = id;
        this.confirmModal.confirmModalVisible = true;
        this.render();
    }
    
    cancelDelete(){
        this.idTodo_ToDelete = null;
        this.confirmModal.confirmModalVisible = false;
        this.render();
    }

    deleteTodo() {
        this.todoService.deleteTodo(this.idTodo_ToDelete);
        this.idTodo_ToDelete = null;
        this.confirmModal.confirmModalVisible = false;
        this.render();
    }

    toggleTodo(id) {
        if(id){
            this.todoService.toggleTodo(id);
        }
    }

    editTodo(data){
        if(data){
            this.todoService.editTodo(data.title, data.id);
        }
    }

}

class TodoService {
    constructor(pubsub) {
        this.pubsub = pubsub;
        this.todos = [];
    }

    createTodo(title){
        let todo = new TodoItem(title, this.pubsub);
        this.todos.push(todo);
        this.pubsub.fireEvent('create', this.todos);
    }

    deleteTodo(id){
        let todoToDel = this.todos.findIndex(todo => todo.id === id);
        this.todos.splice(todoToDel, 1);
        this.pubsub.fireEvent('onDelete', this.todos);
    }
    
    toggleTodo(id){
        let todoToToggle = this.todos.find(todo => todo.id === id);
        todoToToggle.completed = !todoToToggle.completed;
        this.pubsub.fireEvent('onToggle', this.todos);
    }
    editTodo(title, id){
        let todoToEdit = this.todos.find(todo => todo.id === id);
        todoToEdit.title = title;
        this.pubsub.fireEvent('onEdit', this.todos);
    }
}

class TodoFormComponent extends Component {
    constructor(pubsub) {
        super();
        this.pubsub = pubsub;
        this.form = null;
        this.render();
        this.formListener();
    }

    formListener(){
        this.form.addEventListener('submit', (e)=>{
            e.preventDefault();
            let title = e.target.firstChild.value;
            
            this.pubsub.fireEvent('onCreate', title);
            e.target.firstChild.value = '';
        });
    }

    render() {
        this.form = document.createElement('form');
        this.form.className = 'todo-form';

        let input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'What do we have to do?';
        this.form.append(input);
        
        let submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.innerText = 'Add';
        this.form.append(submitButton);
        
        this.element = this.form;
    }
}

class TodoListComponent extends Component {
    constructor(pubsub) {
        super();
        this.element = document.createElement('div');
        this.pubsub = pubsub;
        this.todoList = null;

        this.pubsub.subscribe('create', this, this.render);
        this.pubsub.subscribe('onDelete', this, this.render);
        this.pubsub.subscribe('onToggle', this, this.render);
        this.pubsub.subscribe('onEdit', this, this.render);
    }
    render(data){
        if(data){
            this.element.innerHTML = '';
            this.todoList = data;
            this.todoList.forEach(todoItem => {  
                let item = new TodoItemComponent(this.pubsub, todoItem.id);
                item.render(todoItem.title, todoItem.completed);
                if(todoItem.completed == true){
                    this.element.append(item.element);
                }else{
                    this.element.prepend(item.element);
                }
            })
        }
    }
}

class TodoItemComponent extends Component {
    constructor(pubsub, id) {
        super();
        this.pubsub = pubsub;
        this.id = id;
        this.checkBoxButton = null;
        this.deleteButton = null;
        this.editButton = null;
        this.controlsContainerDiv = null;
        this.editDivContainer = null;
        this.saveButton = null;
    }

    handleEvent() {
        this.deleteButton.addEventListener('click', ()=>{
            this.pubsub.fireEvent('handleDelete', this.id);
        })

        this.checkBoxButton.addEventListener('click', ()=>{
            this.pubsub.fireEvent('toggle', this.id);
        })

        this.editButton.addEventListener('click', ()=>{
            this.controlsContainerDiv.style.display = 'none';
            this.editDivContainer.style.display = '';
        })

        this.saveButton.addEventListener('click', ()=>{
            let data = {title: this.textField.value, id: this.id};
            this.pubsub.fireEvent('edit', data);
        })
    }

    render(title, completed){
        let section = document.createElement('section');
        section.className = 'todo-list';
        

        let arrOfHtmlElements = [];
        this.controlsContainerDiv = document.createElement('div');
        this.controlsContainerDiv.className = 'todo-item';
        this.controlsContainerDiv.className += completed ? ' completed' : '';

        this.checkBoxButton = document.createElement('button');
        this.checkBoxButton.classList.add('checkbox', 'icon' );

        let i = document.createElement('i');
        i.className = 'material-icons';
        i.innerText = completed ? 'check_box' : 'check_box_outline_blank';
        this.checkBoxButton.prepend(i);
    
        let span = document.createElement('span');
        span.className = 'title';
        span.innerText = title;

        let actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions';

        let editButton = document.createElement('button');
        editButton.classList.add('edit', 'icon');

        let edit = document.createElement('i');
        edit.className = 'material-icons';
        edit.innerText = 'create';
        editButton.append(edit);

        actionsDiv.append(editButton);
        this.editButton = editButton;

        this.deleteButton = document.createElement('button');
        this.deleteButton.classList.add('delete', 'icon');

        let iDel = document.createElement('i');
        iDel.className = 'material-icons';
        iDel.innerText = 'delete';
        this.deleteButton.append(iDel);

        actionsDiv.append(this.deleteButton);

        arrOfHtmlElements.push(this.checkBoxButton);
        arrOfHtmlElements.push(span);
        arrOfHtmlElements.push(actionsDiv);

        for(let n = 0; n < arrOfHtmlElements.length; n++){
            this.controlsContainerDiv.append(arrOfHtmlElements[n]);
        }
        ////////////////////////////editDiv
        let arrOfEditElements = [];//arrOf

        let editDivContainer = document.createElement('div');//editDivContainer
        editDivContainer.className = 'todo-item';
        editDivContainer.style.display = 'none';
        this.editDivContainer = editDivContainer;
    
        let textField = document.createElement('input');
        textField.type = 'text';
        textField.value = title;
        this.textField = textField;

        let actionsEditDiv = document.createElement('div');
        actionsEditDiv.className = 'actions';

        this.saveButton = document.createElement('button');
        this.saveButton.classList.add('save', 'icon');

        let save = document.createElement('i');
        save.className = 'material-icons';
        save.innerText = 'save';
        this.saveButton.append(save);

        actionsEditDiv.append(this.saveButton);

        arrOfEditElements.push(textField);
        arrOfEditElements.push(actionsEditDiv);

        for(let n = 0; n < arrOfEditElements.length; n++){
            editDivContainer.append(arrOfEditElements[n]);
        }


        section.append(editDivContainer);
        section.append(this.controlsContainerDiv);


        this.element = section; 
        this.handleEvent();
    }
}

class ConfirmModal extends Component{
    constructor(pubsub){
        super();
        this.pubsub = pubsub;
        this.confirmButton = null;
        this.cancelButton = null;
        this.confirmModalVisible = false;
    }

    handleEvent(){
        this.cancelButton.addEventListener('click', ()=>{
            this.pubsub.fireEvent('cancelDelete');
        });

        this.confirmButton.addEventListener('click', ()=>{
            this.pubsub.fireEvent('delete');
        });
    }

    render() {
        this.modal = document.createElement('div');
        this.modal.className = 'popup';
        this.modal.style.display =  this.confirmModalVisible ? '' : 'none';

        let span = document.createElement('span');
        span.className = 'title';
        span.innerText = 'Are you sure?';
        this.modal.append(span);

        let buttonsContainer = document.createElement('div');

        this.confirmButton = document.createElement('button');
        this.confirmButton.innerText = 'OK';
        buttonsContainer.append(this.confirmButton);

        this.cancelButton = document.createElement('button');
        this.cancelButton.innerText = 'Cancel';
        buttonsContainer.append(this.cancelButton);
        
        this.modal.append(buttonsContainer);

        this.element = this.modal;
        
        this.handleEvent();
        return this.element
    }
}

class TodoItem {
    constructor(title) {
        this.id = uuid();
        this.title = title;
        this.completed = false;
    }
}

class Subscription {
    constructor(event, obj, method) {
        this.event = event;
        this.obj = obj;
        this.method = method;
    }
}

class PubSub {
    constructor() {
        this.subscriptions = [];
    }

    subscribe(event, obj, method) {
        var sub = new Subscription(event, obj, method);
        this.subscriptions.push(sub);
    }

    fireEvent(event, data) {
        for (let i = 0; i < this.subscriptions.length; i++) {
            const sub = this.subscriptions[i];
            if (sub.event == event) {
                sub.method.call(sub.obj, data);
            }
        }
    }
}

let todo = new TodoAppComponent();
document.body.append(todo.element);