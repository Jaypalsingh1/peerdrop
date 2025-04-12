let peerConnection;
let dataChannel;
let recieveChannel;
let file;
let userId;
const ws = new WebSocket("ws://localhost:8895");

const userIdElement = document.getElementById("user-id");
const container = document.querySelector(".container");

ws.onmessage = (e) => {
    let data = JSON.parse(e.data);

    if (data.type === "user-id") {
        userId = data.userId;
        userIdElement.textContent = "user id: "+userId;
    };

    if (data.type === "all-recievers") {
        showUsers(data.userIds);
    };

    if (data.type === "join") {
        createOffer(data.target);
    };

    if (data.type === "offer") {
        let sourceUserId = data.name;
        let offer = data.sdp;

        createAnswer(sourceUserId, offer);
    };

    if (data.type === "answer") {
        let answer = data.sdp;
        addAnswer(answer);
    };

    if (data.type === "new-ice-candidate") {
        const candidate = new RTCIceCandidate(data.candidate);
        addIceCandidates(candidate);
    };

    if (data.type === "request-status") {
        if (data.status === "accepted") {
            ws.send(JSON.stringify({
                type: "initate",
                userId: userId,
                target: data.userId
            }));
        };
    }

    if (data.type === "accept-request") {
        const popup = document.createElement("div");
        popup.className = "popup";

        const message = document.createElement("p");
        message.className = "message"
        message.textContent = `User: ${data.userId} wants to share a file`;

        const accept = document.createElement("button");
        accept.className = "accept";
        accept.textContent = "accept";
        accept.addEventListener("click", () => {
            popup.remove();
            ws.send(JSON.stringify({
                type: "request-status",
                userId: userId,
                target: data.userId,
                status: "accepted"
            }));
        });

        const decline = document.createElement("button");
        decline.className = "decline";
        decline.textContent = "decline";
        decline.addEventListener("click", () => {
            popup.remove();
            ws.send(JSON.stringify({
                type: "request-status",
                userId: userId,
                target: data.userId,
                status: "declined"
            }));
        });

        popup.appendChild(message);
        popup.appendChild(accept);
        popup.appendChild(decline);
        document.body.appendChild(popup);
    };
};

ws.onclose = () => {
    console.log("Wesocket connection closed...");
};

const sendTo = async (e) => {
    ws.send(JSON.stringify({
        type: "accept-request",
        userId: userId,
        target: e.currentTarget.textContent,
        accepted: false
    }));
};

const showUsers = (users) => {
    const wrapper = document.querySelector(".wrapper");

    if (wrapper.childNodes.length > 2) {
        wrapper.lastChild.remove();
    };

    const usersContainer = document.createElement("div");
    usersContainer.className = "users";

    users.map((user) => {
        let userElement = document.createElement("button");
        userElement.className = "user";
        userElement.textContent = user;
        userElement.addEventListener("click", sendTo);
        usersContainer.appendChild(userElement);
    });

    wrapper.appendChild(usersContainer);
};

const onUpload = (e) => {
    file = e.target.files[0];
};

const updateProgress = (progress) => {
    const progressElement = document.querySelector(".progress-bar");
    const progressText = document.querySelector(".progress-text");
    if (progressElement && progressText) {
        progressElement.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
    }
};

const sender = () => {
    container.firstChild.remove();

    ws.send(JSON.stringify({
        type: "sender",
        userId: userId
    }));

    const wrapper = document.createElement("div");
    wrapper.className = "wrapper";

    const status = document.createElement("p");
    status.className = "status";
    status.textContent = "Select a file to transfer";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.className = "file-input";
    fileInput.addEventListener("change", onUpload);

    const progressContainer = document.createElement("div");
    progressContainer.className = "progress-container";
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressBar.style.width = "0%";
    progressContainer.appendChild(progressBar);

    const progressText = document.createElement("p");
    progressText.className = "progress-text";
    progressText.textContent = "0%";

    wrapper.appendChild(status);
    wrapper.appendChild(fileInput);
    wrapper.appendChild(progressContainer);
    wrapper.appendChild(progressText);
    container.appendChild(wrapper);
};

const receiever = () => {
    container.firstChild.remove();

    ws.send(JSON.stringify({
        type: "reciever",
        userId: userId
    }));

    const progress_box = document.createElement("div");
    progress_box.className = "progress_box";

    const progressContainer = document.createElement("div");
    progressContainer.className = "progress-container";
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressBar.style.width = "0%";
    progressContainer.appendChild(progressBar);

    const progressText = document.createElement("p");
    progressText.className = "progress-text";
    progressText.textContent = "0%";

    const status = document.createElement("p");
    status.className = "status";
    status.textContent = "Waiting for file transfer...";

    progress_box.appendChild(progressContainer);
    progress_box.appendChild(progressText);
    progress_box.appendChild(status);

    container.appendChild(progress_box);
};

const homePage = () => {
    const btnContainer = document.createElement("div");
    btnContainer.className = "btn-container";
    const btnsText = ["send", "recieve"];

    btnsText.map((btnText) => {
        let btnElement = document.createElement("button");
        btnElement.className = btnText+" btn"
        btnElement.textContent = btnText;
        btnContainer.appendChild(btnElement);
    });

    container.appendChild(btnContainer);

    const sendBtn = document.querySelector(".send.btn");
    const recieveBtn = document.querySelector(".recieve.btn");

    sendBtn.addEventListener("click", sender);
    recieveBtn.addEventListener("click", receiever);
};

homePage();

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
};

let createPeerConnection = (targetUserId, sender=false) => {
    peerConnection = new RTCPeerConnection(servers);
    peerConnection.addEventListener("icecandidate", (e) => {
        if (e.candidate) {
            ws.send(JSON.stringify({
                type: "new-ice-candidate",
                target: targetUserId,
                candidate: e.candidate
            }));
        };
    });

    if (sender) {
        openDataChannel();
    };

    peerConnection.addEventListener("datachannel", (e) => {
        recieveChannel = e.channel;

        recieveChannel.addEventListener("error", (err) => { 
            console.log("Error:", err); 
        });
          
        let dataArray = [];
        let fileSize = JSON.parse(recieveChannel.label).size;
        let recievedSize = 0;
        
        recieveChannel.addEventListener("message", (e) => { 
            const { data } = e;
            if (data.toString() === "done") {
                recieveChannel.close();
                const blob = new Blob(dataArray);
                downloadFile(blob, JSON.parse(recieveChannel.label).name);
                dataArray = [];
                updateProgress(100);
            } else {
                dataArray.push(data);
                recievedSize += data.byteLength;
                const progress = Math.round((recievedSize / fileSize) * 100);
                updateProgress(progress);
            }
        });
    });
};

const createOffer = async (targetUserId) => {
    createPeerConnection(targetUserId, true);

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    ws.send(JSON.stringify({
        name: userId, 
        target: targetUserId,
        type: "offer",
        sdp: offer
    }));
};

const createAnswer = async (targetUserId, offer) => {
    createPeerConnection(targetUserId);
    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    ws.send(JSON.stringify({
        name: userId, 
        target: targetUserId,
        type: "answer",
        sdp: answer
    }));
};

const addAnswer = async (answer) => {
    if (!peerConnection.currentRemoteDescription) {
        await peerConnection.setRemoteDescription(answer);
    };
};

const addIceCandidates = (candidate) => {
    peerConnection.addIceCandidate(candidate);
};

const openDataChannel = () => { 
    let options = { 
       reliable: true 
    }; 
     
    dataChannel = peerConnection.createDataChannel(JSON.stringify({name: file.name, size: file.size}), options);
    dataChannel.binaryType = "arraybuffer";

    dataChannel.onopen = async () => {
        const chunkSize = 16384;
        const chunks = Math.ceil(file.size / chunkSize);
        let currentChunk = 0;

        const send = () => {
            const start = currentChunk * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const buffer = e.target.result;
                dataChannel.send(buffer);
                currentChunk++;
                
                const progress = Math.round((currentChunk / chunks) * 100);
                updateProgress(progress);
                
                if (currentChunk < chunks) {
                    if (dataChannel.bufferedAmount > dataChannel.bufferedAmountLowThreshold) {
                        dataChannel.onbufferedamountlow = () => {
                            dataChannel.onbufferedamountlow = null;
                            send();
                        };
                    } else {
                        send();
                    }
                } else {
                    dataChannel.send('done');
                }
            };
            reader.readAsArrayBuffer(chunk);
        };

        send();
    };
};

const downloadFile = (blob, fileName) => {
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
};
