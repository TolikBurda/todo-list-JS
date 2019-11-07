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
        // this.pubsub.subscribe('toggle', this, this.toggleTodo); //from todoItem
    }
    render(){
        this.element.append(this.form.element);
        let list = this.todoService.getTodos()
        this.element.append(this.todoList.element)  ///this.todoService.getTodos()
        document.body.appendChild(this.element);
        // this.handleEvent();
    }

    createTodo(title) {
        if(title){
            this.todoService.createTodo(title);
            this.pubsub.fireEvent('create', this.todoService.getTodos());
        }else{
            console.log('just coll');
        }
        // this.render();

        // this.todoList.show();
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
    toggleTodo() {}

}

class TodoService {
    constructor(pubsub) {
        this.pubsub = pubsub;
        this.todos = [];
    }

    createTodo(title){
        let todo = new TodoItemComponent(title, this.pubsub);
        this.todos.push(todo);
        console.log('created', this.todos.length);
    }

    deleteTodo(id){
        console.log('delete todo from serice');
        console.log('1.2');
        let todoToDel = this.todos.findIndex(todo => todo.id === id);
        this.todos.splice(todoToDel, 1);
        console.log(this.todos.length);
        console.log('1.3');
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
        input.placeholder = 'What do we have to do?'
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
        this.pubsub = pubsub;
        this.todoList = null;
        // this.render();
        this.pubsub.subscribe('create', this, this.render);
        this.pubsub.subscribe('onDelete', this, this.render);

    }
    render(data){
        // this.todoList = data;
        // if(this.todoList){
        //     this.todoList.forEach(todoItem => {      
        //         this.element.append(todoItem.element)
        //         console.log(this.todoList.length);
        //     })
        // }
        // console.log(this.element);
        // return this.element
        console.log('1.5',document.body);
        if(data){
            data.forEach(todoItem => {      
                this.element.append(todoItem.element)
            })
        }
        console.log(this.element);
        // return this.element
    }
}

class TodoItemComponent extends Component{/////////////////stop here
    constructor(title, pubsub) {
        super();
        this.id = uuid();
        this.title = title;
        this.completed = false;
        this.pubsub = pubsub
        this.checkBoxButton = null;
        this.delButton = null;
        this.render(this.title, this.id);
        this.handleEvent();
        console.log(`hello, im your todo, MY task is "${title}"`);
        
    }
    handleEvent() {
        this.delButton.addEventListener('click', (e)=>{
            let id = e.target.id;
            
            this.pubsub.fireEvent('delete', id);
        })
    }
    render(title, id) {
        let arrOfHtmlElements = [];

        let section = document.createElement('section');
        section.className = 'todo-list';

        let todoItemDiv = document.createElement('div');
        todoItemDiv.className = 'todo-item';
        // todoItemDiv.contentEditable = true;
        todoItemDiv.className += this.completed ? ' completed' : '';


        let checkboxButton = document.createElement('button');
        checkboxButton.classList.add('checkbox', 'icon' );

        let i = document.createElement('i');
        i.className = 'material-icons';
        i.innerText = this.completed ? 'check_box' : 'check_box_outline_blank';
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
        iDel.id = id;
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
    }
    toggle() {
        // this.completed = !this.completed;
        // console.log('todo class');
    }
    delete() {

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
