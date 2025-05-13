window.addEventListener("load", () => {
    initModalForms()

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes'

        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }

    function getParentId() {
        const u = new URL(window.location)
        const parent = u.searchParams.get("parent")
        return parent
    }

    async function createFile(e) {
        e.preventDefault()
        try {
            const formData = new FormData(e.target);
            const body = { name: formData.get('name') }
            const parent = getParentId()
            if (parent) {
                body['parent'] = parent
            }
            const res = await fetch("/api/nodes/", {
                method: 'post', headers: {
                    "content-type": "application/json",
                    Authorization: getToken()
                }, body: JSON.stringify(body)
            })
            const data = await res.json()
            console.log({ data })
            if (!res.ok) throw new Error(data?.message)
            e.target.reset()
            Toastify({
                text: "Folder has been Created",
                duration: 3000,
                destination: getNextFolder(data.id),
                newWindow: true,
                close: true,
                gravity: "top",
                position: "right",
                stopOnFocus: true,
                style: { background: "oklch(37.3% 0.034 259.733)" }
            }).showToast();
            loadNodes()
        } catch (e) {
            Toastify({
                text: e?.message || "Failed to Create Folder",
                duration: 3000,
                close: true,
                gravity: "top",
                position: "right",
                stopOnFocus: true,
                style: { background: "#d6584f" }
            }).showToast();
        }
    }

    function uploader(e) {
        e.preventDefault()
        const xhr = new XMLHttpRequest()

        const formData = new FormData()
        const fileInput = document.getElementById('files')
        const submitBtn = document.getElementById('submit')
        const percentStatus = document.getElementById('percent')
        const parent = getParentId()

        parent && formData.append('parent', parent)
        formData.append('files', fileInput.files[0])

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100
                const percent = `${formatBytes(event.loaded)}/${formatBytes(event.total)} (${percentComplete.toFixed(2)})`
                percentStatus.innerHTML = percent
            } else {
                console.log('Total upload size is unknown.')
            }
        })

        xhr.onload = function () {
            percentStatus.innerHTML = ""

            console.log(this)

            if (this.status === 200) {
                console.log('Upload complete')
                Toastify({
                    text: "File uploaded successfully!",
                    duration: 3000,
                    close: true,
                    gravity: "top",
                    position: "right",
                    stopOnFocus: true,
                    style: { background: "oklch(37.3% 0.034 259.733)" }
                }).showToast();
                submitBtn.value = "Uploaded"
                loadNodes()
                return
            }

            submitBtn.value = "Upload Failed!"
            Toastify({
                text: JSON.parse(this.response)?.message || "Failed to Upload File",
                duration: 3000,
                close: true,
                gravity: "top",
                position: "right",
                stopOnFocus: true,
                style: { background: "#d6584f" }
            }).showToast();
            console.error('Upload error', this.response.message)
        }

        xhr.open('POST', '/api/nodes/upload')
        xhr.setRequestHeader("Authorization", getToken())
        xhr.send(formData)
        submitBtn.setAttribute('disabled', true)
        submitBtn.value = "Uploading..."
    }

    function changeVisibility(id, show) {
        const f = document.getElementById(id)
        const isHidden = f.classList.contains("hidden")
        if (!isHidden && show) return
        if (isHidden && !show) return
        show ? f.classList.remove('hidden') : f.classList.add('hidden')
    }


    function initModalForms() {
        const uploadModal = document.getElementById("modal")
        const fileForm = document.getElementById('t-file-form')
        const folderForm = document.getElementById("t-folder-form")
        const modalToggleBtns = document.querySelectorAll(".modal-toggle-btn")

        const authorized = !!getToken()

        if (!authorized) {
            fileForm.remove()
            folderForm.remove()
            modalToggleBtns.forEach(e => e.remove())
            return
        }

        fileForm.onsubmit = uploader
        fileForm.onchange = (e) => {
            const label = document.getElementById('filename')
            const file = e.target.files?.[0]
            label.innerHTML = file ? `size: ${formatBytes(file.size)}<br/>${file.name}` : 'No file chosen'

            const submitBtn = document.getElementById('submit')
            submitBtn.value = "Upload"
            submitBtn.disabled = !file

            console.log(e.target.files)
        }

        folderForm.onsubmit = createFile


        modalToggleBtns.forEach(modalToggleBtn => {
            modalToggleBtn.addEventListener("click", () => {
                ['t-folder-form', 't-file-form'].forEach(i => changeVisibility(i, false))

                const isModalOpen = !uploadModal.classList.contains("hidden")

                if (!isModalOpen) {
                    const i = modalToggleBtn.getAttribute("id")
                    changeVisibility(i === 't-file-btn' ? 't-file-form' : 't-folder-form', true)
                }

                changeVisibility("modal", !isModalOpen)
            })
        })
    }
})