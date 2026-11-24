import 'dotenv/config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';

const data = await fs.readFile('./db.json', 'utf-8');
const db = JSON.parse(data);

async function authenticateToken(req, res, next){
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ message: "Access Denied. No token provided." });

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.log(err);
        res.status(401).json({ message: "Invalid or expired token." });
    }
}

async function login(req, res){
    const { username, password } = req.body;

    if (!username || !password){
        return res.status(401).json({ message: "Missing credentials"});
    }

    try {
        let user = db.users.find(account => account.username === username);

        if (!user){
            console.log(`Unlogged-in user attempted username ${username}`);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!await bcrypt.compare(password, user.password)){
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

        res.cookie('accessToken', accessToken, { httpOnly: true, secure: true, maxAge: 60 * 60 * 1000, sameSite: 'strict', path: '/' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal Error" });
    }

    console.log(`${username} logged in`);
    return res.json({ message: "Login successful" });
}

function logout(req, res) {
    res.clearCookie('accessToken', { httpOnly: true, secure: true, maxAge: 60 * 60 * 1000, sameSite: 'strict', path: '/' });
    return res.json({ message: "Logged out" });
}

export default {login, logout, authenticateToken}