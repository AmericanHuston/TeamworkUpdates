const postArea = document.querySelector('#posts');
const form = document.querySelector('#create-post');
const login = document.querySelector('#login');

login.addEventListener('submit', sendLogin);
form.addEventListener('submit', sendPost);
document.addEventListener("DOMContentLoaded", downloadPosts);

function sendLogin(event){
    event.preventDefault();

    const info = new FormData(login);
    fetch('/login', {
        method: 'POST',
        body: info
    })
    .then((response) => { return response.json() })
    .then((result) => { alert(result.message) })
    .catch(() => { alert("Oh naur, never hit the server") });
    downloadPosts();
}

function sendPost(event){
    event.preventDefault();

    const info = new FormData(form);
    fetch('/make-post', {
        method: 'POST',
        body: info
    })
    .then((response) => { return response.json() })
    .then((result) => { alert(result.message) })
    .catch(() => { alert("Oh naur, never hit the server") });
    downloadPosts();
}

function downloadPosts(){
    postArea.innerHTML = "";
    fetch('/posts')
    .then((response) => { return response.json() })
    .then((result) => {
        result.forEach(element => {
            console.log(element);
            try {
                renderPosts(element);
            } catch (err) {
                console.log(err);
            }
        });
    });
    form.reset();
    login.reset();
}

function postTemplate(post){
    let thumbsUp;
    let fire;
    if (post.reactions.thumbsUp.reactors.includes("You")) thumbsUp = "clicked";
    if (post.reactions.fire.reactors.includes("You")) fire = "clicked";
    html = `<h1><img src=${post.userimage}>${post.task}</h1>
        <p>${post.info}</p>
        <button class="thumbsUp ${thumbsUp}" id=${post.id}>${post.reactions.thumbsUp.amount}👍</button>
        <button class="fire ${fire}" id=${post.id}>${post.reactions.fire.amount}🔥</button>`;
    return html;
}

function renderPosts(post){
    let node = document.createElement('div');
    node.id = 'post';
    node.innerHTML = postTemplate(post);
    postArea.appendChild(node);
    node.querySelector('.thumbsUp').addEventListener('click', toggleUpvotes);
    node.querySelector('.fire').addEventListener('click', toggleUpvotes);
}

function toggleUpvotes(event){
    const e = event.currentTarget;
    let emoji;
    if (e.classList[0] === "thumbsUp") {
        emoji = '👍';
    } else if (e.classList[0] === "fire") {
        emoji = '🔥';
    }
    console.log("Click!");
    const numStrings = e.innerHTML.match(/\d+/g);
    if (e.classList.contains('clicked')){
        e.classList.remove('clicked');
        fetch('/remove-reaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "reaction": e.classList[0], "postId": e.id })
        });
        e.innerHTML = `${Number(numStrings) - 1}${emoji}`;
    } else {
        e.classList.add('clicked');
        fetch('/add-reaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "reaction": e.classList[0], "postId": e.id })
        });
        e.innerHTML = `${Number(numStrings) + 1}${emoji}`;
    }
}