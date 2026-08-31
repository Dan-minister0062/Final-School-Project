// src/services/userDataService.js
import { getToken, syncGet, syncSend } from "./apiSync";

class UserDataService {
  constructor() {
    this.users = [];
    this.listeners = [];
    this.initialized = false;
    this.subjects = this.getDefaultSubjects();
    // MySQL is the single source of truth: pull users from the API
    // whenever a real (non-demo) session exists.
    this.syncFromBackend();
  }

  // ===== BACKEND SYNC HELPERS =====
  isDemoSession() {
    const token = getToken();
    return !token || token.startsWith("demo-");
  }

  serverRolePrefix(role) {
    switch (role) {
      case "admin":
        return "ADMIN";
      case "teacher":
        return "TCH";
      case "parent":
        return "PAR";
      case "student":
        return "STU";
      default:
        return "USR";
    }
  }

  mapServerUser(su) {
    const role = su.role || "student";
    const name = su.name || "";
    const nameParts = name.trim().split(/\s+/);
    const local = {
      _serverId: su.id,
      id: `${this.serverRolePrefix(role)}/${new Date().getFullYear()}/S${su.id}`,
      name,
      firstName: nameParts.slice(0, -1).join(" ") || name,
      lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
      email: su.email || "",
      phone: su.phone || "",
      address: su.address || "",
      status: su.status || "active",
      role,
      avatar: su.avatar || null,
      department: su.department || "",
      bio: su.bio || "",
      created_at: su.created_at || new Date().toISOString(),
      last_login: su.last_login || null,
      // Personal information (all roles)
      dateOfBirth: su.dateOfBirth || "",
      gender: su.gender || "",
      nationality: su.nationality || "",
      cin: su.cin || "",
      city: su.city || "",
      emergencyContactName: su.emergencyContactName || "",
      emergencyContactRelationship: su.emergencyContactRelationship || "",
      emergencyContactPhone: su.emergencyContactPhone || "",
    };

    if (role === "teacher") {
      local.qualifications =
        Array.isArray(su.qualifications) && su.qualifications.length > 0
          ? su.qualifications
          : su.qualification
            ? [su.qualification]
            : [];
      local.subjects =
        Array.isArray(su.subjects) && su.subjects.length > 0
          ? su.subjects
          : su.subject
            ? [su.subject]
            : [];
      local.assignedClasses = Array.isArray(su.assignedClasses)
        ? su.assignedClasses
        : [];
      local.classes = local.assignedClasses;
      local.experienceYears = su.experieDnceYears ?? su.experience ?? 0;
      local.experience = local.experienceYears;
      local.specialization = su.specialization || "";
      local.employmentType = su.employmentType || "";
      local.previousSchool = su.previousSchool || "";
      local.level = su.level || "";
      local.educationLevel = local.level;
      local.education_level = local.level;
    }

    if (role === "student") {
      const className = su.className || su.class_name || su.department || "";
      const level = su.level || su.bio || "";
      local.className = className;
      local.class = className;
      local.department = className;
      local.level = level;
      local.educationLevel = level;
      local.education_level = level;
      local.classLevel = level;
      local.class_level = level;
      local.massarNumber = su.massarNumber || "";
      local.academicYear = su.academicYear || "";
      local.admissionType = su.admissionType || "";
      local.previousSchool = su.previousSchool || "";
      local.previousClass = su.previousClass || "";
      local.previousAcademicYear = su.previousAcademicYear || "";
      local.parentName = su.parentName || "";
      local.parentEmail = su.parentEmail || "";
      local.parentPhone = su.parentPhone || "";
      local.attendance = su.attendance ?? 0;
      local.averageGrade = su.averageGrade ?? 0;
    }

    if (role === "parent") {
      local.occupation = su.occupation || "";
      local.employer = su.employer || "";
      local.childrenNames = Array.isArray(su.childrenNames)
        ? su.childrenNames
        : [];
    }

    return local;
  }

  async syncFromBackend() {
    if (this.isDemoSession()) return;
    const res = await syncGet("/users", { per_page: 1000 });
    // Backend wraps lists in a paginator: { data: { data: [...], links, meta } }
    const serverUsers = Array.isArray(res?.data) ? res.data : res?.data?.data;
    if (!Array.isArray(serverUsers)) return;

    // The API (MySQL) is the source of truth: replace the in-memory list.
    this.users = serverUsers.map((su) => this.mapServerUser(su));
    this.initialized = true;
    this.notifyListeners("backend_sync", null, [...this.users]);
  }

  buildServerPayload(user) {
    const payload = {
      name:
        user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      address: user.address || "",
      status: user.status || "active",
    };

    // Personal information (all roles) — only include when set
    [
      "dateOfBirth",
      "gender",
      "nationality",
      "cin",
      "city",
      "emergencyContactName",
      "emergencyContactRelationship",
      "emergencyContactPhone",
    ].forEach((key) => {
      if (user[key] !== undefined && user[key] !== null && user[key] !== "") {
        payload[key] = user[key];
      }
    });

    if (user.role === "teacher") {
      if (user.level !== undefined && user.level !== null)
        payload.level = user.level;
      else if (user.educationLevel !== undefined)
        payload.level = user.educationLevel;
      if (Array.isArray(user.subjects)) payload.subjects = user.subjects;
      if (Array.isArray(user.qualifications))
        payload.qualifications = user.qualifications;
      if (Array.isArray(user.assignedClasses))
        payload.assignedClasses = user.assignedClasses;
      else if (Array.isArray(user.classes))
        payload.assignedClasses = user.classes;
      if (user.specialization !== undefined)
        payload.specialization = user.specialization;
      if (user.experienceYears !== undefined && user.experienceYears !== "")
        payload.experienceYears = Number(user.experienceYears) || 0;
      else if (user.experience !== undefined && user.experience !== "")
        payload.experienceYears = Number(user.experience) || 0;
      if (user.employmentType !== undefined && user.employmentType !== "")
        payload.employmentType = user.employmentType;
      if (user.previousSchool !== undefined && user.previousSchool !== "")
        payload.previousSchool = user.previousSchool;
    }

    if (user.role === "student") {
      const className = user.className || user.class || "";
      const level = user.level || "";
      payload.className = className;
      payload.department = className;
      payload.level = level;
      payload.bio = level;
      [
        "massarNumber",
        "academicYear",
        "admissionType",
        "previousSchool",
        "previousClass",
        "previousAcademicYear",
        "parentName",
        "parentEmail",
        "parentPhone",
      ].forEach((key) => {
        if (user[key] !== undefined && user[key] !== null && user[key] !== "") {
          payload[key] = user[key];
        }
      });
      if (user.attendance !== undefined && user.attendance !== null)
        payload.attendance = Number(user.attendance) || 0;
      if (user.averageGrade !== undefined && user.averageGrade !== null)
        payload.averageGrade = Number(user.averageGrade) || 0;
    }

    if (user.role === "parent") {
      ["occupation", "employer"].forEach((key) => {
        if (user[key] !== undefined && user[key] !== null && user[key] !== "") {
          payload[key] = user[key];
        }
      });
      if (Array.isArray(user.childrenNames)) {
        payload.childrenNames = user.childrenNames;
      }
    }

    return payload;
  }

  attachServerId(localId, serverUser) {
    const user = this.getUserById(localId);
    if (!user || !serverUser?.id) return;
    user._serverId = serverUser.id;
  }

  async pushCreateUser(user) {
    if (this.isDemoSession()) return;
    const payload = this.buildServerPayload(user);
    if (!payload.email) return;
    if (!payload.name) payload.name = payload.email.split("@")[0];
    const res = await syncSend("post", "/users", {
      ...payload,
      password: user.password || Math.random().toString(36).slice(-10),
    });
    if (res?.success && res?.data) {
      // Replace the optimistic record with the MySQL row (keep local id
      // so components holding a reference stay consistent).
      const mapped = this.mapServerUser(res.data);
      const index = this.users.findIndex((u) => u.id === user.id);
      if (index >= 0) {
        this.users[index] = { ...mapped, id: user.id };
      }
      this.notifyListeners("backend_sync", null, [...this.users]);
    }
  }

  async pushUpdateUser(user, changedFields = {}) {
    if (this.isDemoSession() || !user?._serverId) return;
    const whitelist = [
      "name",
      "email",
      "phone",
      "address",
      "status",
      "role",
      "department",
      "bio",
      "password",
      // Personal information (all roles)
      "dateOfBirth",
      "gender",
      "nationality",
      "cin",
      "city",
      "emergencyContactName",
      "emergencyContactRelationship",
      "emergencyContactPhone",
      // Teacher fields
      "level",
      "subjects",
      "qualifications",
      "assignedClasses",
      "specialization",
      "experienceYears",
      "employmentType",
      "previousSchool",
      // Student fields
      "massarNumber",
      "academicYear",
      "admissionType",
      "previousClass",
      "previousAcademicYear",
      "parentName",
      "parentEmail",
      "parentPhone",
      "className",
      "attendance",
      "averageGrade",
      // Parent fields
      "occupation",
      "employer",
      "childrenNames",
    ];
    const payload = {};
    Object.keys(changedFields).forEach((key) => {
      if (whitelist.includes(key) && changedFields[key] !== undefined) {
        payload[key] = changedFields[key];
      }
    });
    if (
      changedFields.firstName !== undefined ||
      changedFields.lastName !== undefined
    ) {
      const firstName = changedFields.firstName ?? user.firstName ?? "";
      const lastName = changedFields.lastName ?? user.lastName ?? "";
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) payload.name = fullName;
    }
    if (user.role === "student") {
      if (changedFields.className !== undefined)
        payload.department = changedFields.className;
      if (changedFields.level !== undefined) payload.bio = changedFields.level;
    }
    if (user.role === "parent") {
      let names =
        changedFields.childrenNames !== undefined
          ? changedFields.childrenNames
          : changedFields.children_names;
      if (names !== undefined) {
        if (typeof names === "string") {
          names = names.includes(",")
            ? names
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : names
              ? [names]
              : [];
        } else if (!Array.isArray(names)) {
          names = [];
        }
        payload.childrenNames = names;
      }
    }
    // Mirror camelCase aliases the backend expects for legacy columns
    if (payload.className !== undefined && user.role === "student") {
      payload.department = payload.className;
    }
    if (Object.keys(payload).length === 0) return;
    const res = await syncSend("put", `/users/${user._serverId}`, payload);
    if (res?.success && res?.data) {
      // Reflect the persisted MySQL row in memory.
      const mapped = this.mapServerUser(res.data);
      const index = this.users.findIndex((u) => u.id === user.id);
      if (index >= 0) {
        this.users[index] = { ...mapped, id: user.id };
        this.notifyListeners("backend_sync", null, [...this.users]);
      }
    }
    return res;
  }

  pushDeleteUser(user) {
    if (this.isDemoSession() || !user?._serverId) return;
    return syncSend("delete", `/users/${user._serverId}`);
  }

  // ===== GENERATE ID WITH FORMAT =====
  generateId(role) {
    const year = new Date().getFullYear();

    let prefix = "";
    switch (role) {
      case "admin":
        prefix = "ADMIN";
        break;
      case "teacher":
        prefix = "TCH";
        break;
      case "parent":
        prefix = "PAR";
        break;
      case "student":
        prefix = "STU";
        break;
      default:
        prefix = "USR";
    }

    const roleUsers = this.users.filter((u) => u.role === role);
    const roleIds = roleUsers
      .map((u) => u.id)
      .filter(
        (id) => typeof id === "string" && id.startsWith(`${prefix}/${year}`),
      )
      .map((id) => parseInt(id.split("/")[2]) || 0);

    let nextNumber = roleIds.length > 0 ? Math.max(...roleIds) + 1 : 1;
    const formattedNumber = String(nextNumber).padStart(4, "0");
    return `${prefix}/${year}/${formattedNumber}`;
  }

  loadFromStorage() {
    // Business data is no longer persisted in localStorage.
    // The users list lives in MySQL and is loaded via syncFromBackend().
    this.initialized = true;
    return this.users;
  }

  migrateData() {
    this.users = this.users.map((user) => {
      const migrated = { ...user };

      if (
        typeof migrated.id === "number" ||
        (typeof migrated.id === "string" && !migrated.id.includes("/"))
      ) {
        const oldId = migrated.id;
        const newId = this.generateId(migrated.role);
        migrated.id = newId;
        migrated.old_id = oldId;
      }

      if (migrated.role === "teacher") {
        if (!migrated.level && migrated.educationLevel) {
          migrated.level = migrated.educationLevel;
        }
        if (!migrated.level && migrated.education_level) {
          migrated.level = migrated.education_level;
        }
        if (!migrated.level && migrated.classLevel) {
          migrated.level = migrated.classLevel;
        }

        if (migrated.level) {
          migrated.educationLevel = migrated.level;
          migrated.education_level = migrated.level;
          migrated.classLevel = migrated.level;
          migrated.class_level = migrated.level;
        }

        if (typeof migrated.qualifications === "string") {
          if (migrated.qualifications.includes(",")) {
            migrated.qualifications = migrated.qualifications
              .split(",")
              .map((s) => s.trim());
          } else if (migrated.qualifications) {
            migrated.qualifications = [migrated.qualifications];
          } else {
            migrated.qualifications = [];
          }
        } else if (!Array.isArray(migrated.qualifications)) {
          migrated.qualifications = [];
        }

        if (typeof migrated.subjects === "string") {
          if (migrated.subjects.includes(",")) {
            migrated.subjects = migrated.subjects
              .split(",")
              .map((s) => s.trim());
          } else if (migrated.subjects) {
            migrated.subjects = [migrated.subjects];
          } else {
            migrated.subjects = [];
          }
        } else if (!Array.isArray(migrated.subjects)) {
          migrated.subjects = [];
        }

        if (typeof migrated.assignedClasses === "string") {
          if (migrated.assignedClasses.includes(",")) {
            migrated.assignedClasses = migrated.assignedClasses
              .split(",")
              .map((s) => s.trim());
          } else if (migrated.assignedClasses) {
            migrated.assignedClasses = [migrated.assignedClasses];
          } else {
            migrated.assignedClasses = [];
          }
        } else if (!Array.isArray(migrated.assignedClasses)) {
          migrated.assignedClasses = [];
        }
      }

      if (migrated.role === "parent") {
        if (typeof migrated.children_names === "string") {
          if (migrated.children_names.includes(",")) {
            migrated.children_names = migrated.children_names
              .split(",")
              .map((s) => s.trim());
          } else if (migrated.children_names) {
            migrated.children_names = [migrated.children_names];
          } else {
            migrated.children_names = [];
          }
        } else if (!Array.isArray(migrated.children_names)) {
          migrated.children_names = [];
        }
        migrated.children_count = migrated.children_names.length;

        if (!migrated.childrenIds) {
          migrated.childrenIds = [];
        }
      }

      if (migrated.role === "student") {
        if (!migrated.level && migrated.educationLevel) {
          migrated.level = migrated.educationLevel;
        }
        if (!migrated.level && migrated.classLevel) {
          migrated.level = migrated.classLevel;
        }
        if (!migrated.level && migrated.education_level) {
          migrated.level = migrated.education_level;
        }

        if (migrated.level) {
          migrated.educationLevel = migrated.level;
          migrated.education_level = migrated.level;
          migrated.classLevel = migrated.level;
          migrated.class_level = migrated.level;
        }

        if (migrated.subjects && typeof migrated.subjects === "string") {
          migrated.subjects = migrated.subjects.includes(",")
            ? migrated.subjects.split(",").map((s) => s.trim())
            : [migrated.subjects];
        }

        if (!migrated.className && migrated.class) {
          migrated.className = migrated.class;
        }
        if (!migrated.class && migrated.className) {
          migrated.class = migrated.className;
        }

        if (migrated.parentName && !migrated.parent) {
          migrated.parent = migrated.parentName;
        }
        if (migrated.parent && !migrated.parentName) {
          migrated.parentName = migrated.parent;
        }
        if (migrated.parentName && !migrated.parent_name) {
          migrated.parent_name = migrated.parentName;
        }
      }

      return migrated;
    });
  }

  saveToStorage() {
    // No-op: business data must live in MySQL only.
  }

  getUsers() {
    return this.users;
  }

  getUsersByRole(role) {
    return this.users.filter((user) => user.role === role);
  }

  getUserById(id) {
    return this.users.find((user) => user.id === id);
  }

  // ===== ADD USER WITH ROLE-SPECIFIC DATA =====
  addUser(userData) {
    const generatedId = this.generateId(userData.role);

    let childrenNames = userData.children_names || [];
    if (typeof childrenNames === "string") {
      childrenNames = childrenNames.includes(",")
        ? childrenNames.split(",").map((s) => s.trim())
        : childrenNames
          ? [childrenNames]
          : [];
    } else if (!Array.isArray(childrenNames)) {
      childrenNames = [];
    }

    let childrenIds = userData.childrenIds || [];
    if (typeof childrenIds === "string") {
      childrenIds = childrenIds.includes(",")
        ? childrenIds.split(",").map((s) => s.trim())
        : childrenIds
          ? [childrenIds]
          : [];
    } else if (!Array.isArray(childrenIds)) {
      childrenIds = [];
    }

    let qualifications = userData.qualifications || [];
    if (typeof qualifications === "string") {
      qualifications = qualifications.includes(",")
        ? qualifications.split(",").map((s) => s.trim())
        : qualifications
          ? [qualifications]
          : [];
    } else if (!Array.isArray(qualifications)) {
      qualifications = [];
    }

    let subjects = userData.subjects || [];
    if (typeof subjects === "string") {
      subjects = subjects.includes(",")
        ? subjects.split(",").map((s) => s.trim())
        : subjects
          ? [subjects]
          : [];
    } else if (!Array.isArray(subjects)) {
      subjects = [];
    }

    let assignedClasses = userData.assignedClasses || [];
    if (typeof assignedClasses === "string") {
      assignedClasses = assignedClasses.includes(",")
        ? assignedClasses.split(",").map((s) => s.trim())
        : assignedClasses
          ? [assignedClasses]
          : [];
    } else if (!Array.isArray(assignedClasses)) {
      assignedClasses = [];
    }

    const fullName =
      userData.firstName && userData.lastName
        ? `${userData.firstName} ${userData.lastName}`.trim()
        : userData.name || "";

    const baseUser = {
      id: generatedId,
      created_at: new Date().toISOString(),
      last_login: null,
      avatar: null,
      status: userData.status || "pending",
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      name: fullName,
      email: userData.email || "",
      phone: userData.phone || "",
      address: userData.address || "",
      city: userData.city || "",
      dateOfBirth: userData.dateOfBirth || "",
      gender: userData.gender || "",
      nationality: userData.nationality || "",
      cin: userData.cin || "",
      profilePhoto: userData.profilePhoto || null,
      role: userData.role || "teacher",
      emergencyContactName: userData.emergencyContactName || "",
      emergencyContactRelationship: userData.emergencyContactRelationship || "",
      emergencyContactPhone: userData.emergencyContactPhone || "",
      ...userData,
    };

    let newUser = { ...baseUser };

    if (userData.role === "teacher") {
      const teacherLevel =
        userData.level ||
        userData.educationLevel ||
        userData.education_level ||
        userData.classLevel ||
        userData.class_level ||
        "";

      newUser = {
        ...newUser,
        level: teacherLevel,
        educationLevel: teacherLevel,
        education_level: teacherLevel,
        classLevel: teacherLevel,
        class_level: teacherLevel,
        subjects: subjects,
        qualifications: qualifications,
        specialization: userData.specialization || "",
        experienceYears: userData.experienceYears || "",
        employmentType: userData.employmentType || "",
        previousSchool: userData.previousSchool || "",
        assignedClasses: assignedClasses,
        department: userData.department || "Education",
        qualification:
          qualifications.length > 0 ? qualifications.join(", ") : "",
        experience: userData.experienceYears || 0,
        classes: assignedClasses.map((id) => id),
      };

      console.log("👨‍🏫 Teacher added with:", {
        level: teacherLevel,
        subjects: subjects,
        qualifications: qualifications,
        assignedClasses: assignedClasses,
        name: fullName,
      });
    } else if (userData.role === "student") {
      const studentLevel =
        userData.level ||
        userData.educationLevel ||
        userData.education_level ||
        userData.classLevel ||
        userData.class_level ||
        "";
      const studentClass = userData.className || userData.class || "";
      const parentName = userData.parentName || userData.parent || "";
      const parentEmail = userData.parentEmail || userData.parent_email || "";

      newUser = {
        ...newUser,
        level: studentLevel,
        educationLevel: studentLevel,
        education_level: studentLevel,
        classLevel: studentLevel,
        class_level: studentLevel,
        className: studentClass,
        class: studentClass,
        parentName: parentName,
        parent: parentName,
        parent_name: parentName,
        parentEmail: parentEmail,
        parent_email: parentEmail,
        parentPhone: userData.parentPhone || "",
        academicYear: userData.academicYear || "",
        admissionType: userData.admissionType || "",
        previousSchool: userData.previousSchool || "",
        previousClass: userData.previousClass || "",
        previousAcademicYear: userData.previousAcademicYear || "",
        massarNumber: userData.massarNumber || "",
        parentId: userData.parentId || "",
        subjects: subjects,
        attendance: userData.attendance || 0,
        average_grade: userData.average_grade || 0,
        department: studentClass || "Student",
        avgScore: userData.average_grade || 0,
      };

      console.log("📘 Student added with:", {
        level: studentLevel,
        className: studentClass,
        parentName: parentName,
        name: fullName,
      });
    } else if (userData.role === "parent") {
      newUser = {
        ...newUser,
        occupation: userData.occupation || "",
        employer: userData.employer || "",
        children_names: childrenNames,
        childrenIds: childrenIds,
        children_count: childrenNames.length,
        department: "Parents",
        children: childrenNames.map((name) => ({ name, class: "", age: 0 })),
        children_names_string: childrenNames.join(", "),
      };

      console.log("👨‍👩‍👧 Parent added with:", {
        name: fullName,
        children: childrenNames,
        childrenCount: childrenNames.length,
      });
    } else if (userData.role === "admin") {
      newUser = {
        ...newUser,
        department: "Administration",
        permissions: userData.permissions || ["all"],
      };
    }

    this.users = [newUser, ...this.users];
    this.saveToStorage();
    this.notifyListeners("add", newUser);
    this.pushCreateUser(newUser);
    return newUser;
  }

  // ===== UPDATE USER =====
  updateUser(id, updatedData) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      console.error("User not found:", id);
      return null;
    }

    const oldUser = this.users[index];
    const updatedUser = {
      ...oldUser,
      ...updatedData,
      updated_at: new Date().toISOString(),
    };

    if (
      updatedData.firstName !== undefined ||
      updatedData.lastName !== undefined
    ) {
      const firstName = updatedData.firstName || oldUser.firstName || "";
      const lastName = updatedData.lastName || oldUser.lastName || "";
      updatedUser.name = `${firstName} ${lastName}`.trim();
    }

    if (updatedUser.role === "parent") {
      let childrenNames =
        updatedData.children_names !== undefined
          ? updatedData.children_names
          : updatedUser.children_names;

      if (typeof childrenNames === "string") {
        childrenNames = childrenNames.includes(",")
          ? childrenNames.split(",").map((s) => s.trim())
          : childrenNames
            ? [childrenNames]
            : [];
      } else if (!Array.isArray(childrenNames)) {
        childrenNames = [];
      }

      let childrenIds =
        updatedData.childrenIds !== undefined
          ? updatedData.childrenIds
          : updatedUser.childrenIds;

      if (typeof childrenIds === "string") {
        childrenIds = childrenIds.includes(",")
          ? childrenIds.split(",").map((s) => s.trim())
          : childrenIds
            ? [childrenIds]
            : [];
      } else if (!Array.isArray(childrenIds)) {
        childrenIds = [];
      }

      updatedUser.children_names = childrenNames;
      updatedUser.childrenIds = childrenIds;
      updatedUser.children_count = childrenNames.length;
      updatedUser.children_names_string = childrenNames.join(", ");
      updatedUser.children = childrenNames.map((name) => ({
        name,
        class: "",
        age: 0,
      }));
    }

    if (updatedUser.role === "teacher") {
      if (updatedData.level !== undefined) {
        updatedUser.level = updatedData.level;
        updatedUser.educationLevel = updatedData.level;
        updatedUser.education_level = updatedData.level;
        updatedUser.classLevel = updatedData.level;
        updatedUser.class_level = updatedData.level;
      }
      if (updatedData.educationLevel !== undefined) {
        updatedUser.level = updatedData.educationLevel;
        updatedUser.educationLevel = updatedData.educationLevel;
        updatedUser.education_level = updatedData.educationLevel;
        updatedUser.classLevel = updatedData.educationLevel;
        updatedUser.class_level = updatedData.educationLevel;
      }

      let qualifications =
        updatedData.qualifications !== undefined
          ? updatedData.qualifications
          : updatedUser.qualifications;

      if (typeof qualifications === "string") {
        qualifications = qualifications.includes(",")
          ? qualifications.split(",").map((s) => s.trim())
          : qualifications
            ? [qualifications]
            : [];
      } else if (!Array.isArray(qualifications)) {
        qualifications = [];
      }

      let subjects =
        updatedData.subjects !== undefined
          ? updatedData.subjects
          : updatedUser.subjects;

      if (typeof subjects === "string") {
        subjects = subjects.includes(",")
          ? subjects.split(",").map((s) => s.trim())
          : subjects
            ? [subjects]
            : [];
      } else if (!Array.isArray(subjects)) {
        subjects = [];
      }

      let assignedClasses =
        updatedData.assignedClasses !== undefined
          ? updatedData.assignedClasses
          : updatedUser.assignedClasses;

      if (typeof assignedClasses === "string") {
        assignedClasses = assignedClasses.includes(",")
          ? assignedClasses.split(",").map((s) => s.trim())
          : assignedClasses
            ? [assignedClasses]
            : [];
      } else if (!Array.isArray(assignedClasses)) {
        assignedClasses = [];
      }

      updatedUser.qualifications = qualifications;
      updatedUser.subjects = subjects;
      updatedUser.assignedClasses = assignedClasses;
      updatedUser.qualification =
        qualifications.length > 0 ? qualifications.join(", ") : "";
      updatedUser.assigned_classes = assignedClasses;
      updatedUser.classes = assignedClasses.map((id) => id);
    }

    if (updatedUser.role === "student") {
      if (updatedData.level !== undefined) {
        updatedUser.level = updatedData.level;
        updatedUser.educationLevel = updatedData.level;
        updatedUser.education_level = updatedData.level;
        updatedUser.classLevel = updatedData.level;
        updatedUser.class_level = updatedData.level;
      }
      if (updatedData.educationLevel !== undefined) {
        updatedUser.level = updatedData.educationLevel;
        updatedUser.educationLevel = updatedData.educationLevel;
        updatedUser.education_level = updatedData.educationLevel;
        updatedUser.classLevel = updatedData.educationLevel;
        updatedUser.class_level = updatedData.educationLevel;
      }

      let subjects =
        updatedData.subjects !== undefined
          ? updatedData.subjects
          : updatedUser.subjects;

      if (typeof subjects === "string") {
        subjects = subjects.includes(",")
          ? subjects.split(",").map((s) => s.trim())
          : subjects
            ? [subjects]
            : [];
      } else if (!Array.isArray(subjects)) {
        subjects = [];
      }

      updatedUser.subjects = subjects;

      if (updatedData.className !== undefined) {
        updatedUser.className = updatedData.className;
        updatedUser.class = updatedData.className;
        updatedUser.department = updatedData.className;
      }
      if (updatedData.parentName !== undefined) {
        updatedUser.parentName = updatedData.parentName;
        updatedUser.parent = updatedData.parentName;
        updatedUser.parent_name = updatedData.parentName;
      }
      if (updatedData.parentEmail !== undefined) {
        updatedUser.parentEmail = updatedData.parentEmail;
        updatedUser.parent_email = updatedData.parentEmail;
      }
      if (updatedData.parentPhone !== undefined) {
        updatedUser.parentPhone = updatedData.parentPhone;
      }
      if (updatedData.attendance !== undefined) {
        updatedUser.attendance = Math.max(
          0,
          Math.min(100, updatedData.attendance),
        );
      }
      if (updatedData.average_grade !== undefined) {
        updatedUser.average_grade = Math.max(
          0,
          Math.min(100, updatedData.average_grade),
        );
        updatedUser.avgScore = updatedUser.average_grade;
      }
      if (updatedData.academicYear !== undefined) {
        updatedUser.academicYear = updatedData.academicYear;
      }
      if (updatedData.admissionType !== undefined) {
        updatedUser.admissionType = updatedData.admissionType;
      }
      if (updatedData.massarNumber !== undefined) {
        updatedUser.massarNumber = updatedData.massarNumber;
      }
    }

    if (updatedUser.role === "parent") {
      if (updatedData.occupation !== undefined) {
        updatedUser.occupation = updatedData.occupation;
      }
      if (updatedData.employer !== undefined) {
        updatedUser.employer = updatedData.employer;
      }
      if (updatedData.childrenIds !== undefined) {
        updatedUser.childrenIds = Array.isArray(updatedData.childrenIds)
          ? updatedData.childrenIds
          : [];
      }
    }

    if (updatedData.emergencyContactName !== undefined) {
      updatedUser.emergencyContactName = updatedData.emergencyContactName;
    }
    if (updatedData.emergencyContactRelationship !== undefined) {
      updatedUser.emergencyContactRelationship =
        updatedData.emergencyContactRelationship;
    }
    if (updatedData.emergencyContactPhone !== undefined) {
      updatedUser.emergencyContactPhone = updatedData.emergencyContactPhone;
    }

    if (updatedData.firstName !== undefined) {
      updatedUser.firstName = updatedData.firstName;
    }
    if (updatedData.lastName !== undefined) {
      updatedUser.lastName = updatedData.lastName;
    }
    if (updatedData.dateOfBirth !== undefined) {
      updatedUser.dateOfBirth = updatedData.dateOfBirth;
    }
    if (updatedData.gender !== undefined) {
      updatedUser.gender = updatedData.gender;
    }
    if (updatedData.nationality !== undefined) {
      updatedUser.nationality = updatedData.nationality;
    }
    if (updatedData.city !== undefined) {
      updatedUser.city = updatedData.city;
    }
    if (updatedData.cin !== undefined) {
      updatedUser.cin = updatedData.cin;
    }

    this.users[index] = updatedUser;
    this.saveToStorage();
    this.notifyListeners("update", this.users[index]);
    this.pushUpdateUser(updatedUser, updatedData);
    return this.users[index];
  }

  // ===== GET ALL SUBJECTS =====
  getAllSubjects() {
    return this.subjects || this.getDefaultSubjects();
  }

  // ===== GET SUBJECTS FOR LEVEL =====
  getSubjectsForLevel(level) {
    const allSubjects = this.getAllSubjects();
    if (allSubjects && allSubjects[level]) {
      return allSubjects[level];
    }
    return [];
  }

  // ===== GET DEFAULT SUBJECTS =====
  getDefaultSubjects() {
    return {
      kindergarten: [
        { value: "quran_k", label: "Qur'an", labelAr: "القرآن الكريم" },
        { value: "english_k", label: "English", labelAr: "اللغة الإنجليزية" },
        { value: "french_k", label: "French", labelAr: "اللغة الفرنسية" },
        { value: "arabic_k", label: "Arabic", labelAr: "اللغة العربية" },
      ],
      primary: [
        { value: "quran_p", label: "Qur'an", labelAr: "القرآن الكريم" },
        { value: "arabic_p", label: "Arabic", labelAr: "اللغة العربية" },
        { value: "english_p", label: "English", labelAr: "اللغة الإنجليزية" },
        { value: "french_p", label: "French", labelAr: "اللغة الفرنسية" },
        { value: "mathematics_p", label: "Mathematics", labelAr: "الرياضيات" },
        { value: "science_p", label: "Science", labelAr: "العلوم" },
        { value: "sports_p", label: "Sports", labelAr: "الرياضة" },
        { value: "ict_p", label: "ICT", labelAr: "تكنولوجيا المعلومات" },
        { value: "art_p", label: "Art & Plastic", labelAr: "الفنون التشكيلية" },
        { value: "geography_p", label: "Geography", labelAr: "الجغرافيا" },
      ],
      secondary: [
        { value: "quran_s", label: "Qur'an", labelAr: "القرآن الكريم" },
        { value: "arabic_s", label: "Arabic", labelAr: "اللغة العربية" },
        { value: "english_s", label: "English", labelAr: "اللغة الإنجليزية" },
        { value: "french_s", label: "French", labelAr: "اللغة الفرنسية" },
        { value: "mathematics_s", label: "Mathematics", labelAr: "الرياضيات" },
        {
          value: "svt_s",
          label: "SVT (Biology)",
          labelAr: "علوم الحياة والأرض",
        },
        { value: "physics_s", label: "Physics", labelAr: "الفيزياء" },
        { value: "sports_s", label: "Sports", labelAr: "الرياضة" },
        { value: "ict_s", label: "ICT", labelAr: "تكنولوجيا المعلومات" },
        { value: "geography_s", label: "Geography", labelAr: "الجغرافيا" },
      ],
      high_school: [
        { value: "quran_h", label: "Qur'an", labelAr: "القرآن الكريم" },
        { value: "arabic_h", label: "Arabic", labelAr: "اللغة العربية" },
        { value: "english_h", label: "English", labelAr: "اللغة الإنجليزية" },
        { value: "french_h", label: "French", labelAr: "اللغة الفرنسية" },
        { value: "mathematics_h", label: "Mathematics", labelAr: "الرياضيات" },
        {
          value: "svt_h",
          label: "SVT (Biology)",
          labelAr: "علوم الحياة والأرض",
        },
        { value: "physics_h", label: "Physics", labelAr: "الفيزياء" },
        { value: "sports_h", label: "Sports", labelAr: "الرياضة" },
        { value: "ict_h", label: "ICT", labelAr: "تكنولوجيا المعلومات" },
        { value: "geography_h", label: "Geography", labelAr: "الجغرافيا" },
        { value: "philosophy_h", label: "Philosophy", labelAr: "الفلسفة" },
      ],
    };
  }

  // ===== UPDATE SUBJECTS =====
  updateSubjects(subjects) {
    this.subjects = subjects;
    this.notifyListeners("subjects_updated", subjects);
  }

  // ===== SAVE SUBJECTS =====
  saveSubjects(subjects) {
    this.subjects = subjects;
    this.notifyListeners("subjects_updated", subjects);
  }

  // ===== UPDATE STUDENT ATTENDANCE =====
  updateStudentAttendance(studentId, attendance) {
    const user = this.getUserById(studentId);
    if (!user) {
      console.error("Student not found:", studentId);
      return null;
    }

    if (user.role !== "student") {
      console.error("User is not a student:", studentId);
      return null;
    }

    return this.updateUser(studentId, {
      attendance: Math.max(0, Math.min(100, attendance)),
    });
  }

  // ===== UPDATE STUDENT AVERAGE GRADE =====
  updateStudentAverageGrade(studentId, average_grade) {
    const user = this.getUserById(studentId);
    if (!user) {
      console.error("Student not found:", studentId);
      return null;
    }

    if (user.role !== "student") {
      console.error("User is not a student:", studentId);
      return null;
    }

    return this.updateUser(studentId, {
      average_grade: Math.max(0, Math.min(100, average_grade)),
    });
  }

  // ===== DELETE USER =====
  deleteUser(id) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      console.error("User not found:", id);
      return null;
    }

    const deleted = this.users[index];
    this.users = this.users.filter((user) => user.id !== id);
    this.saveToStorage();
    this.notifyListeners("delete", deleted);
    this.pushDeleteUser(deleted);
    return deleted;
  }

  // ===== TOGGLE USER STATUS =====
  toggleStatus(id) {
    const user = this.getUserById(id);
    if (!user) {
      console.error("User not found:", id);
      return null;
    }

    const newStatus = user.status === "active" ? "inactive" : "active";
    return this.updateUser(id, { status: newStatus });
  }

  // ===== RESET PASSWORD =====
  resetPassword(id) {
    const user = this.getUserById(id);
    if (!user) {
      console.error("User not found:", id);
      return null;
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    console.log(`🔑 Password reset for ${user.email}: ${tempPassword}`);

    const updatedUser = this.updateUser(id, {
      tempPassword,
      password_reset_at: new Date().toISOString(),
    });

    if (!this.isDemoSession() && user._serverId) {
      syncSend("post", `/admin/users/${user._serverId}/reset-password`).then(
        (res) => {
          if (res?.success && res?.data?.tempPassword && updatedUser) {
            updatedUser.tempPassword = res.data.tempPassword;
            this.saveToStorage();
          }
        },
      );
    }

    return updatedUser;
  }

  // ===== RESEND INVITE =====
  resendInvite(id) {
    const user = this.getUserById(id);
    if (!user) {
      console.error("User not found:", id);
      return null;
    }

    console.log(`📧 Resending invitation to ${user.email}`);
    return this.updateUser(id, {
      invite_resent_at: new Date().toISOString(),
      invite_resent_count: (user.invite_resent_count || 0) + 1,
    });
  }

  // ===== BULK ACTIONS =====
  bulkAction(userIds, action) {
    if (!userIds || userIds.length === 0) {
      console.error("No users selected for bulk action");
      return [];
    }

    const results = [];
    userIds.forEach((id) => {
      const user = this.getUserById(id);
      if (user) {
        let result = null;
        switch (action) {
          case "activate":
            result = this.updateUser(id, { status: "active" });
            break;
          case "deactivate":
            result = this.updateUser(id, { status: "inactive" });
            break;
          case "suspend":
            result = this.updateUser(id, { status: "suspended" });
            break;
          case "delete":
            result = this.deleteUser(id);
            break;
          default:
            console.warn("Unknown bulk action:", action);
            break;
        }
        if (result) results.push(result);
      }
    });

    this.notifyListeners("bulk", { action, results });
    return results;
  }

  // ===== GET STATS =====
  getStats() {
    return {
      total: this.users.length,
      active: this.users.filter((u) => u.status === "active").length,
      inactive: this.users.filter((u) => u.status === "inactive").length,
      pending: this.users.filter((u) => u.status === "pending").length,
      suspended: this.users.filter((u) => u.status === "suspended").length,
      admins: this.users.filter((u) => u.role === "admin").length,
      teachers: this.users.filter((u) => u.role === "teacher").length,
      parents: this.users.filter((u) => u.role === "parent").length,
      students: this.users.filter((u) => u.role === "student").length,
    };
  }

  // ===== GET TEACHERS WITH DETAILS =====
  getTeachersWithDetails() {
    return this.users
      .filter((u) => u.role === "teacher")
      .map((teacher) => ({
        ...teacher,
        qualifications_list: Array.isArray(teacher.qualifications)
          ? teacher.qualifications
          : [],
        subjects_list: Array.isArray(teacher.subjects) ? teacher.subjects : [],
        assigned_classes_list: Array.isArray(teacher.assignedClasses)
          ? teacher.assignedClasses
          : [],
        subject_name:
          teacher.subjects && teacher.subjects.length > 0
            ? teacher.subjects[0]
            : "",
        level_label: teacher.level || teacher.educationLevel || "",
        experience: teacher.experienceYears || teacher.experience || 0,
        employment_type: teacher.employmentType || "",
      }));
  }

  // ===== GET PARENTS WITH CHILDREN =====
  getParentsWithChildren() {
    return this.users
      .filter((u) => u.role === "parent")
      .map((parent) => ({
        ...parent,
        children_list: Array.isArray(parent.children_names)
          ? parent.children_names
          : [],
        children_count: Array.isArray(parent.children_names)
          ? parent.children_names.length
          : 0,
        children_ids: Array.isArray(parent.childrenIds)
          ? parent.childrenIds
          : [],
        occupation: parent.occupation || "",
        employer: parent.employer || "",
      }));
  }

  // ===== GET STUDENTS WITH PARENT INFO =====
  getStudentsWithParentInfo() {
    return this.users
      .filter((u) => u.role === "student")
      .map((student) => ({
        ...student,
        parent_name:
          student.parentName || student.parent_name || student.parent || "",
        parent_email: student.parentEmail || student.parent_email || "",
        parent_phone: student.parentPhone || "",
        class_name: student.className || student.class || "",
        level_label: student.level || student.educationLevel || "",
        attendance_percent: student.attendance || 0,
        average_grade_percent: student.average_grade || student.avgScore || 0,
        academic_year: student.academicYear || "",
        admission_type: student.admissionType || "",
        massar_number: student.massarNumber || "",
      }));
  }

  // ===== ADD LISTENER - CRITICAL FIX =====
  addListener(callback) {
    if (typeof callback !== "function") {
      console.error("Listener must be a function");
      return () => {};
    }

    this.listeners.push(callback);
    console.log("👂 Listener added, total:", this.listeners.length);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
      console.log("👂 Listener removed, total:", this.listeners.length);
    };
  }

  // ===== NOTIFY LISTENERS - Always pass the users array =====
  notifyListeners(action, data, usersArray) {
    const users = usersArray || [...this.users];
    console.log(`📢 Notifying ${this.listeners.length} listeners: ${action}`);
    this.listeners.forEach((callback) => {
      try {
        // Call with action, data, and users array
        callback(action, data, users);
      } catch (e) {
        console.error("Error notifying listener:", e);
      }
    });
  }

  // ===== NOTIFY LISTENERS =====
  notifyListeners(action, data) {
    console.log(`📢 Notifying ${this.listeners.length} listeners: ${action}`);
    this.listeners.forEach((callback) => {
      try {
        callback(action, data, [...this.users]);
      } catch (e) {
        console.error("Error notifying listener:", e);
      }
    });
  }

  // ===== FORCE REFRESH =====
  forceRefresh() {
    this.loadFromStorage();
    this.syncFromBackend();
    this.notifyListeners("refresh", null, [...this.users]);
    return this.users;
  }

  // ===== CLEAR ALL DATA =====
  clearAllData() {
    if (window.confirm("Are you sure you want to delete all user data?")) {
      this.users = [];
      this.saveToStorage();
      this.notifyListeners("clear", null, []);
      console.log("🗑️ All user data cleared");
      return true;
    }
    return false;
  }

  // ===== EXPORT DATA =====
  exportData() {
    return {
      users: this.users,
      exported_at: new Date().toISOString(),
      version: "2.0",
      total: this.users.length,
    };
  }

  // ===== IMPORT DATA =====
  importData(data) {
    if (!data || !data.users || !Array.isArray(data.users)) {
      console.error("Invalid import data");
      return false;
    }

    this.users = data.users;
    this.migrateData();
    this.saveToStorage();
    this.notifyListeners("import", data, [...this.users]);
    console.log("📥 Data imported:", this.users.length, "users");
    return true;
  }

  // ===== SEARCH USERS =====
  searchUsers(query) {
    if (!query) return this.users;

    const searchLower = query.toLowerCase();
    return this.users.filter((user) => {
      const fullName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`.toLowerCase()
          : (user.name || "").toLowerCase();

      return (
        fullName.includes(searchLower) ||
        (user.email || "").toLowerCase().includes(searchLower) ||
        (user.phone || "").includes(query) ||
        (user.id || "").toLowerCase().includes(searchLower) ||
        (user.city || "").toLowerCase().includes(searchLower)
      );
    });
  }

  // ===== GET USER BY EMAIL =====
  getUserByEmail(email) {
    return this.users.find((user) => user.email === email);
  }

  // ===== GET USERS BY STATUS =====
  getUsersByStatus(status) {
    return this.users.filter((user) => user.status === status);
  }

  // ===== GET USERS BY LEVEL =====
  getUsersByLevel(level) {
    return this.users.filter((user) => user.level === level);
  }
}

// ===== SINGLETON INSTANCE =====
const userDataService = new UserDataService();

if (typeof window !== "undefined") {
  window.userDataService = userDataService;
}

export default userDataService;
