import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

// --- 1. REGISTER ---
const register = async (req, res) => {
  const {
    email,
    password,
    full_name,
    phone_number,
    role_type,
    license_no,
    specialization,
    badge_no,
    rank,
    legal_name,
    owner_type,
    proficiency_level,
    blood_type,
    supervisor_id,
  } = req.body;

  if (!email || !password || !full_name) {
    return res
      .status(400)
      .json({ message: "Email, Password, and Name are required." });
  }

  // Role Validation
  if (role_type === "Specialist") {
    if (!license_no || !specialization) {
      return res
        .status(400)
        .json({
          message: "Specialists must provide License No and Specialization.",
        });
    }
  } else if (role_type === "First_Responder") {
    if (!badge_no || !rank) {
      return res
        .status(400)
        .json({ message: "First Responders must provide Badge No and Rank." });
    }
  } else if (role_type === "Volunteer") {
    if (!proficiency_level) {
      return res
        .status(400)
        .json({ message: "Volunteers must provide a Proficiency Level." });
    }
    const validLevels = ["Beginner", "Intermediate", "Expert"];
    if (!validLevels.includes(proficiency_level)) {
      return res
        .status(400)
        .json({
          message: "Proficiency must be Beginner, Intermediate, or Expert.",
        });
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userCheck = await client.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email],
    );
    if (userCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userInsertQuery = `
            INSERT INTO users (email, password_hash, full_name, phone_number, role_type) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING user_id, email, role_type, full_name
        `;
    const userResult = await client.query(userInsertQuery, [
      email,
      password_hash,
      full_name,
      phone_number,
      role_type || "Citizen",
    ]);

    const newUser = userResult.rows[0];
    const userId = newUser.user_id;

    if (role_type === "Specialist") {
      await client.query(
        `INSERT INTO specialists (user_id, license_no, specialization) VALUES ($1, $2, $3)`,
        [userId, license_no, specialization],
      );
    } else if (role_type === "First_Responder") {
      await client.query(
        `INSERT INTO first_responders (user_id, badge_no, rank, blood_type, supervisor_id) 
                 VALUES ($1, $2, $3, $4, $5)`,
        [userId, badge_no, rank, blood_type, supervisor_id || null],
      );
    } else if (role_type === "Owner") {
      await client.query(
        `INSERT INTO owners (user_id, legal_name, owner_type) VALUES ($1, $2, $3)`,
        [userId, legal_name || full_name, owner_type || "Individual"],
      );
    } else if (role_type === "Volunteer") {
      await client.query(
        `INSERT INTO volunteers (user_id, verification_date) VALUES ($1, CURRENT_DATE)`,
        [userId],
      );

      const skillName = "General Support";

      let skillCheck = await client.query(
        `SELECT skill_id FROM skills WHERE skill_name = $1`,
        [skillName],
      );

      let skillId;

      if (skillCheck.rows.length > 0) {
        skillId = skillCheck.rows[0].skill_id;
      } else {
        const newSkill = await client.query(
          `INSERT INTO skills (skill_name) VALUES ($1) RETURNING skill_id`,
          [skillName],
        );
        skillId = newSkill.rows[0].skill_id;
      }

      await client.query(
        `INSERT INTO volunteer_skills (volunteer_id, skill_id, proficiency_level) 
                 VALUES ($1, $2, $3)`,
        [userId, skillId, proficiency_level],
      );
    }

    await client.query("COMMIT");

    const token = jwt.sign(
      { user_id: userId, role: role_type },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(201).json({ token, user: newUser });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Registration Transaction Error:", err.message);

    if (err.code === "23505") {
      return res
        .status(409)
        .json({
          message:
            "Duplicate entry (Email, Phone, License, or Badge already taken).",
        });
    }

    res.status(500).json({ message: "Server Error during registration" });
  } finally {
    client.release();
  }
};

// --- 2. LOGIN ---
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userResult = await pool.query(
      "SELECT * FROM Users WHERE email = $1",
      [email],
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const user = userResult.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role_type,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        role_type: user.role_type,
        full_name: user.full_name,
      },
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).send("Server Error");
  }
};

// --- 3. GET PROFILE ---
// REMOVED 'export' keyword here to avoid duplicate export error
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const userResult = await pool.query(
      "SELECT user_id, full_name, email, phone_number, role_type FROM Users WHERE user_id = $1",
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];
    let roleData = {};

    if (user.role_type === "Specialist") {
      const result = await pool.query(
        "SELECT license_no, specialization FROM Specialists WHERE user_id = $1",
        [userId],
      );
      roleData = result.rows[0] || {};
    } else if (
      user.role_type === "First_Responder" ||
      user.role_type === "Responder"
    ) {
      const result = await pool.query(
        "SELECT badge_no, rank, blood_type, supervisor_id FROM First_Responders WHERE user_id = $1",
        [userId],
      );
      roleData = result.rows[0] || {};
    } else if (user.role_type === "Volunteer") {
      const result = await pool.query(
        "SELECT proficiency_level, verification_date FROM Volunteers WHERE user_id = $1",
        [userId],
      );
      const volData = result.rows[0] || {};
      roleData = {
        proficiency_level: volData.proficiency_level,
        skills_verified: !!volData.verification_date,
      };
    } else if (user.role_type === "Owner") {
      const result = await pool.query(
        "SELECT legal_name, owner_type FROM Owners WHERE user_id = $1",
        [userId],
      );
      const ownerInfo = result.rows[0] || {};

      try {
        const countRes = await pool.query(
          "SELECT COUNT(*) FROM building_ownership WHERE owner_id = $1 AND end_date IS NULL",
          [userId],
        );
        roleData = {
          ...ownerInfo,
          total_properties: parseInt(countRes.rows[0].count) || 0,
        };
      } catch (e) {
        roleData = { ...ownerInfo, total_properties: 0 };
      }
    }

    res.json({ ...user, ...roleData });
  } catch (err) {
    console.error("Profile Fetch Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// --- 4. CHANGE PASSWORD ---
const changePassword = async (req, res) => {
    const { old_password, new_password } = req.body;
    const userId = req.user.user_id;

    if (!old_password || !new_password) {
        return res.status(400).json({ message: "Both old and new passwords are required." });
    }

    const client = await pool.connect();
    try {
        const userResult = await client.query("SELECT password_hash FROM Users WHERE user_id = $1", [userId]);
        const user = userResult.rows[0];

        const validPassword = await bcrypt.compare(old_password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: "Incorrect old password." });
        }

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(new_password, salt);

        await client.query("UPDATE Users SET password_hash = $1 WHERE user_id = $2", [newHash, userId]);

        res.json({ message: "Password updated successfully." });
    } catch (err) {
        console.error("Change Password Error:", err);
        res.status(500).json({ message: "Server error" });
    } finally {
        client.release();
    }
};

// --- 5. GET SKILLS ---
const getAvailableSkills = async (req, res) => {
    try {
        // Fetch all possible skills for the dropdown
        const skills = await pool.query("SELECT * FROM Skills ORDER BY skill_name ASC");
        
        // Fetch skills ALREADY assigned to this volunteer
        const mySkills = await pool.query(
            `SELECT s.skill_id, s.skill_name, vs.proficiency_level 
             FROM Volunteer_Skills vs
             JOIN Skills s ON vs.skill_id = s.skill_id
             WHERE vs.volunteer_id = $1`,
            [req.user.user_id]
        );

        res.json({
            all_skills: skills.rows,
            my_skills: mySkills.rows
        });
    } catch (err) {
        console.error("Get Skills Error:", err);
        res.status(500).json({ message: "Failed to fetch skills" });
    }
};

// --- 6. ADD SKILL ---
const addVolunteerSkill = async (req, res) => {
    const { skill_id, proficiency_level } = req.body;
    const userId = req.user.user_id;

    try {
        await pool.query(
            `INSERT INTO Volunteer_Skills (volunteer_id, skill_id, proficiency_level)
             VALUES ($1, $2, $3)
             ON CONFLICT (volunteer_id, skill_id) 
             DO UPDATE SET proficiency_level = EXCLUDED.proficiency_level`,
            [userId, skill_id, proficiency_level]
        );
        res.json({ message: "Skill added/updated successfully" });
    } catch (err) {
        console.error("Add Skill Error:", err);
        res.status(500).json({ message: "Failed to add skill" });
    }
};

// --- CLEAN EXPORTS ---
export { 
    register, 
    login, 
    getUserProfile, 
    changePassword,
    getAvailableSkills,
    addVolunteerSkill
};