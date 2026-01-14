import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import pool from '../config/db.js'


const register = async (req, res) => {
    
    const { 
        email, password, full_name, phone_number, role_type,
        license_no, specialization,
        badge_no, rank,
        legal_name, owner_type,
        proficiency_level
    } = req.body

    if (!email || !password || !full_name) {
        return res.status(400).json({ message: "Email, Password, and Name are required." })
    }

    if (role_type === 'Specialist') {
        if (!license_no || !specialization) {
            return res.status(400).json({ message: "Specialists must provide License No and Specialization." })
        }
    } 
    else if (role_type === 'First_Responder') {
        if (!badge_no || !rank) {
            return res.status(400).json({ message: "First Responders must provide Badge No and Rank." })
        }
    } 
    else if (role_type === 'Volunteer') {
        if (!proficiency_level) {
            return res.status(400).json({ message: "Volunteers must provide a Proficiency Level." })
        }
        const validLevels = ['Beginner', 'Intermediate', 'Expert']
        if (!validLevels.includes(proficiency_level)) {
            return res.status(400).json({ message: "Proficiency must be Beginner, Intermediate, or Expert." })
        }
    }

    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        const userCheck = await client.query("SELECT user_id FROM users WHERE email = $1", [email])
        if (userCheck.rows.length > 0) {
            await client.query('ROLLBACK')
            return res.status(409).json({ message: "User already exists" })
        }

        const salt = await bcrypt.genSalt(10)
        const password_hash = await bcrypt.hash(password, salt)

        const userInsertQuery = `
            INSERT INTO users (email, password_hash, full_name, phone_number, role_type) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING user_id, email, role_type, full_name
        `
        const userResult = await client.query(userInsertQuery, [
            email, password_hash, full_name, phone_number, role_type || 'Citizen'
        ])
        
        const newUser = userResult.rows[0]
        const userId = newUser.user_id

        if (role_type === 'Specialist') {
            await client.query(
                `INSERT INTO specialists (user_id, license_no, specialization) VALUES ($1, $2, $3)`,
                [userId, license_no, specialization]
            )
        } 
        else if (role_type === 'First_Responder') {
            await client.query(
                `INSERT INTO first_responders (user_id, badge_no, rank) VALUES ($1, $2, $3)`,
                [userId, badge_no, rank]
            )
        } 
        else if (role_type === 'Owner') {
            await client.query(
                `INSERT INTO owners (user_id, legal_name, owner_type) VALUES ($1, $2, $3)`,
                [userId, legal_name || full_name, owner_type || 'Individual']
            )
        }
        else if (role_type === 'Volunteer') {
            await client.query(
                `INSERT INTO volunteers (user_id, verification_date) VALUES ($1, CURRENT_DATE)`,
                [userId]
            )

            const skillName = 'General Support'
            
            let skillCheck = await client.query(
                `SELECT skill_id FROM skills WHERE skill_name = $1`, 
                [skillName]
            )

            let skillId

            if (skillCheck.rows.length > 0) {
                skillId = skillCheck.rows[0].skill_id
            } else {
                const newSkill = await client.query(
                    `INSERT INTO skills (skill_name) VALUES ($1) RETURNING skill_id`, 
                    [skillName]
                )
                skillId = newSkill.rows[0].skill_id
            }

            await client.query(
                `INSERT INTO volunteer_skills (volunteer_id, skill_id, proficiency_level) 
                 VALUES ($1, $2, $3)`,
                [userId, skillId, proficiency_level]
            )
        }

        await client.query('COMMIT')

        const token = jwt.sign(
            { user_id: userId, role: role_type },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        )

        res.status(201).json({ token, user: newUser })

    } catch (err) {
        await client.query('ROLLBACK')
        console.error("Registration Transaction Error:", err.message)
        
        if (err.code === '23505') {
             return res.status(409).json({ message: "Duplicate entry (Email, Phone, License, or Badge already taken)." })
        }

        res.status(500).json({ message: "Server Error during registration" })
    } finally {
        client.release()
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userResult = await pool.query("SELECT * FROM Users WHERE email = $1", [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }

        const user = userResult.rows[0];

        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }

        // ✅ FIX: Match the payload structure used in 'register'
        // This ensures the middleware always has access to user_id and role
        const token = jwt.sign(
            { 
                user_id: user.user_id, 
                role: user.role_type // Added role for consistency
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" } // Extended to 24h so you don't get logged out while devving
        );

        res.json({ 
            token, 
            user: { 
                user_id: user.user_id, 
                email: user.email, 
                role_type: user.role_type,
                full_name: user.full_name 
            }
        });
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).send("Server Error");
    }
};

export { register, login }