const tokenKey = "token"

function getToken() {
    return localStorage.getItem(tokenKey)
}

function deleteToken() {
    localStorage.removeItem(tokenKey)
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'post', headers: { 'content-type': 'application/json', authorization: getToken() } })
    deleteToken()
}

async function login(password) {
    const res = await fetch('/api/auth/login', {
        method: 'post',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.message)
    if (!data.token) throw new Error("Login Failed, cannot create token!")
    return data.token
}