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

        this.title = 'My 2Do';
        document.getElementsByTagName('header')[0].innerHTML = this.title;

        this.render();

        this.pubsub.subscribe('onCreate', this, this.createTodo); //from form
        this.pubsub.subscribe('delete', this, this.deleteTodo); //from todoItem
        this.pubsub.subscribe('toggle', this, this.toggleTodo); //from todoItem
    }
    render(){
        this.element.append(this.form.element);
        let list = this.todoService.getTodos();
        this.element.append(this.todoList.element);  ///this.todoService.getTodos()
        document.body.appendChild(this.element);
    }

    createTodo(title) {
        if(title){
            this.todoService.createTodo(title);

            this.pubsub.fireEvent('create', this.todoService.getTodos());
        }else{
            console.log('just coll');
        }
    }
    deleteTodo(id) {
        if(id){
            this.todoService.deleteTodo(id);
            this.pubsub.fireEvent('onDelete', this.todoService.getTodos());
            this.render();
        }else{
            console.log('just coll');
        }
    }
    toggleTodo(id) {
        if(id){
            this.todoService.toggleTodo(id);
            this.pubsub.fireEvent('onToggle', this.todoService.getTodos());
            this.render();
        }else{
            console.log('just coll');
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
        console.log('created', this.todos.length);
    }

    deleteTodo(id){
        let todoToDel = this.todos.findIndex(todo => todo.id === id);
        this.todos.splice(todoToDel, 1);
        console.log(this.todos.length);
    }
    
    toggleTodo(id){
        let todoToToggle = this.todos.find(todo => todo.id === id);
        console.log(id, 'todoList Class');
        todoToToggle.completed = !todoToToggle.completed;
    }

    getTodos() {
        return this.todos;
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
        let form = document.createElement('form');
        form.className = 'todo-form';

        let input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'What do we have to do?';
        form.append(input);
        
        let submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.innerText = 'Add';
        form.append(submitButton);
        
        this.form = form;
        this.element = form;
    }
}

class TodoListComponent extends Component{
    constructor(pubsub) {
        super();
        this.element = document.createElement('div');
        this.element.id = 'item-conteiner';
        this.pubsub = pubsub;
        this.todoList = null;

        this.pubsub.subscribe('create', this, this.render);
        this.pubsub.subscribe('onDelete', this, this.render);
        this.pubsub.subscribe('onToggle', this, this.render);
    }
    render(data){
        if(data){
            document.getElementById('item-conteiner').innerHTML = '';
            this.todoList = data;
            this.todoList.forEach(todoItem => {  
                let item = new TodoItemComponent(this.pubsub, todoItem.id);
                item.render(todoItem.title, todoItem.completed);
                
                this.element.append(item.element);
            })
        }else{
            console.log('just a call');
        }
    }
}

class TodoItemComponent extends Component{
    constructor(pubsub, id) {
        super();
        this.pubsub = pubsub;
        this.id = id;
        this.checkBoxButton = null;
        this.delButton = null;
    }

    handleEvent() {
        this.delButton.addEventListener('click', ()=>{
            
            this.pubsub.fireEvent('delete', this.id);
        })

        this.checkBoxButton.addEventListener('click', ()=>{
            
            this.pubsub.fireEvent('toggle', this.id);
        })
    }
/////////////////////////////////
    render(title, completed){
        let arrOfHtmlElements = [];

        let section = document.createElement('section');
        section.className = 'todo-list';

        let todoItemDiv = document.createElement('div');
        todoItemDiv.className = 'todo-item';
        // todoItemDiv.contentEditable = true;
        todoItemDiv.className += completed ? ' completed' : '';


        let checkboxButton = document.createElement('button');
        checkboxButton.classList.add('checkbox', 'icon' );

        let i = document.createElement('i');
        i.className = 'material-icons';
        i.innerText = completed ? 'check_box' : 'check_box_outline_blank';
        checkboxButton.prepend(i);
        this.checkBoxButton = checkboxButton;
    
        let span = document.createElement('span');
        span.className = 'title';
        span.innerText = title;

        let actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions';

        let deleteButton = document.createElement('button');
        deleteButton.classList.add('delete', 'icon');

        let iDel = document.createElement('i');
        iDel.className = 'material-icons';
        iDel.id = this.id;
        iDel.innerText = 'delete';
        deleteButton.append(iDel);

        actionsDiv.append(deleteButton);
        this.delButton = deleteButton;
        
        arrOfHtmlElements.push(checkboxButton);
        arrOfHtmlElements.push(span);
        arrOfHtmlElements.push(actionsDiv);

        for(let n = 0; n < arrOfHtmlElements.length; n++){
            todoItemDiv.append(arrOfHtmlElements[n]);
            section.append(todoItemDiv);
        }
        this.element = section; 
        this.handleEvent();
    }
}

class TodoItem{
    constructor(title) {
        this.id = uuid();
        this.title = title;
        this.completed = false;
        console.log(`hello, MY task is "${title}"`);
    }
}

//-------------------------------------------------------------------------------------------
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
// document.body.append(todo.element);
