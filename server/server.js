import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import axios from "axios";
import dotenv from "dotenv";
import multer from "multer";
import cloudinary from "cloudinary"
import Razorpay from "razorpay";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const supabaseUrl = "https://vmvxxjofzfpwvatbquhy.supabase.co";
const supabaseKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtdnh4am9memZwd3ZhdGJxdWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAxNzA1NjMsImV4cCI6MjA0NTc0NjU2M30.rt7ORhBz7UaHSE_gTWvX-D82uj_CQidpKcC1hVLLovA";
const supabase = createClient(supabaseUrl, supabaseKey);

cloudinary.config({
  cloud_name: "dtuqpup4a",
  api_key: "291317165429892",
  api_secret: "qJq00V57nGffgM_ev-BcG5Tbmnk",
});

const razorpayId = "rzp_test_cpR703nvZzCIdo";
const razorpaySecret = "3r0f7OjbhQUoEgqNTSnePXgI";
const whatsappToken = "EAAXEAIh0ErgBOZBmOtR577kld5uCM8owhsQEmQ128ZCxeGpZA1J7C6pEhRKjLaXIv4dP46xitQW2lgV2d5tpy7QQb5NZAVfS2k6fAkRZAerUYvStMKuuxE2R1PHXeeChGO6sK0Ocsqa01lqazvmZCLJNuVyri8r0y2Ehp8tAE23EzgRGnoIsHKoOPiCzZBEkMmbuPDIzZCR3zWw2OI6KLalVry5acyrujpZC1iEAZD";
const whatsappId = "470207039510486";

const uploadCloudinary = async (localFilePath) => {
  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
    });
    return response.url;
  } catch (error) {
    console.error(error.message);
  }
};

app.post("/user/register", async (req, res) => {
  // Destructure user inputs from request body
  const { name, email, address, phone, password } = req.body;

  // Validate input fields
  if (!name || !email || !address || !phone || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          password: hashedPassword,
          address,
          phone,
          name,
        },
      ])
      .select("*"); // Select all fields to confirm successful insertion

    // Handle Supabase insertion errors
    if (error) {
      console.error("Error inserting user into users table:", error);
      return res.status(500).json({
        message: "Error registering user",
        error: error.message,
      });
    }

    // Remove password from the response for security
    const safeUser = {
      ...data[0],
      password: undefined, // Explicitly exclude the password
    };

    // Respond with success
    res.status(201).json({
      message: "User registered successfully",
      user: safeUser,
    });
  } catch (err) {
    // Catch unexpected errors
    console.error("Unexpected Error:", err);
    res.status(500).json({
      message: "An unexpected error occurred",
      error: err.message,
    });
  }
});


// User login route
app.post("/user/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !users) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, users.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        email: users.email,
        address: users.address,
        phone: users.phone,
        name: users.name,
      },
    });
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({
      message: "An unexpected error occurred",
      error: err.message,
    });
  }
});


app.post("/upload/pic", upload.single("avatar"), async (req, res) => {
  try {
    const responseUrl = await uploadCloudinary(req.file.path);
    res.json({ picUrl: responseUrl });
  } catch (error) {
    res.status(500).send("Error uploading image");
  }
});

app.post("/upload", async (req, res) => {
  const { name, description, price, image } = req.body;

  if (!name || !description || !price || !image) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: name,
          description: description,
          price: price,
          image:image,
        },
      ])
      .select();

    if (error) {
      return res.status(500).json({
        message: "Error uploading product",
        error: error.message,
      });
    }

    res.status(201).json({
      message: "Product uploaded successfully",
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      message: "An unexpected error occurred",
      error: err.message,
    });
  }
});

app.post("/create-and-send-payment-link", async (req, res) => {
  const { amount, customerName, customerContact, customerEmail, orderDetails } = req.body;

  if (!amount || !customerName || !customerContact || !customerEmail || !orderDetails || orderDetails.length === 0) {
    console.warn("Request validation failed: missing required fields");
    return res.status(400).json({ error: "Missing required fields" });
  }

  const razorpay = new Razorpay({
    key_id: razorpayId,
    key_secret: razorpaySecret,
  });

  const paymentLinkData = {
    upi_link: false,
    amount: amount * 100,
    currency: "INR",
    accept_partial: false,
    first_min_partial_amount: 100,
    expire_by: Math.floor(Date.now() / 1000) + 86400,
    reference_id: `TS${Date.now()}${Math.floor(Math.random() * 1000)}`,
    description: `Payment for ${customerName}`,
    customer: {
      contact: customerContact,
      email: customerEmail,
      name: customerName,
    },
    notify: {
      sms: true,
      email: true,
    },
    reminder_enable: true,
    notes: {
      policy_name: "Policy 1",
    },
    callback_url: "http://localhost:8000/payment/",
    callback_method: "get",
  };

  let paymentLink;
  try {
    console.log("Attempting to create a payment link");
    paymentLink = await razorpay.paymentLink.create(paymentLinkData);
    console.log("Payment link created successfully:", paymentLink.short_url);
  } catch (error) {
    console.error("Error creating payment link:", error.message);
    return res.status(500).json({ error: "Failed to create payment link" });
  }

  const orderItems = orderDetails
    .map(item => `- **${item.productName}**: ₹${item.price} x ${item.quantity}`)
    .join("\n");

  const message = `
Hello ${customerName},

Thank you for your order!

Here are the payment details:
- Amount: ₹${amount}
- Description: Payment for ${customerName}

Order Details:
${orderItems}

Click the link below to complete your payment:
${paymentLink.short_url}

If you have any questions, feel free to reply to this message.

Thank you for shopping with us!`;

try {
  console.log("Attempting to send WhatsApp message to:", customerContact);

  const { data: users, error: fetchError } = await supabase
    .from("users")
    .select("hasContacted")
    .eq("phone", customerContact)
    .single();

  if (fetchError) {
    console.error("Error fetching user info:", fetchError.message);
    throw new Error("Failed to check contact status");
  }

  if (!users || !users.hasContacted) {
    console.log("Customer not contacted before, sending template message...");
    await axios.post(
      `https://graph.facebook.com/v21.0/${whatsappId}/messages`,
      {
        messaging_product: "whatsapp",
        to: customerContact,
        type: "template",
        template: {
          name: "hello_world",
          language: { code: "en_US" },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { data: updatedData, error: updateError } = await supabase
      .from("users")
      .update({ hasContacted: true })
      .eq("phone", customerContact);

    if (updateError) {
      console.error("Error updating user contact status:", updateError.message);
      throw new Error("Failed to update contact status");
    }

    console.log("Template message sent and user marked as contacted.");
    res.status(200).json({
      message: "Payment link created and template sent via WhatsApp",
      paymentLink: paymentLink.short_url,
    });
  } else {
    console.log("Customer already contacted, sending detailed payment info...");
    const whatsappResponse = await axios.post(
      `https://graph.facebook.com/v21.0/${whatsappId}/messages`,
      {
        messaging_product: "whatsapp",
        to: customerContact,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Detailed payment info sent successfully:", whatsappResponse.data);
    res.status(200).json({
      message: "Payment link created and detailed info sent via WhatsApp",
      paymentLink: paymentLink.short_url,
    });
  }
} catch (error) {
  console.error("Error sending WhatsApp message:", error.message);
  res.status(500).json({
    error: "Failed to send WhatsApp message, but payment link was created",
    paymentLink: paymentLink.short_url,
  });
}


});

app.post("/add-to-cart",async(req,res)=>{
  const {id,name,price,customer_id}=req.body;
  try {
    let {data:carts,error:fetchError}=await supabase.from('cart').select('items').eq('customer_id',customer_id);
    if (fetchError) throw fetchError;

    const cart = carts && carts.length > 0 ? carts[0] : null;
    if(cart){
      let items = cart.items.length === 0 ? [] : [...cart.items];
      let found=false;
      items=items.map((item)=>{
        if(item.p_id==id){
          found=true;
          return {...item,quantity:item.quantity+1}
        }else{
          return item;
        }
      })
      if(!found){
        items.push({'p_id':id,'name':name,'quantity':1,'price':price});
      }
      try {
        const {data:updatedData,error:updateError} = await supabase.from('cart').update({items}).eq('customer_id',customer_id).select();
        if(updatedData){
          res.status(201).json({
            message:"Succesfully updated !!!",
            data:updatedData,
          })
        }else{
          throw updateError;
        }
      } catch (error) {
        res.status(500).json({
          message:"Couldn't update table",
          error: error.message
        })
      }
    }else{
      const items=[{'p_id':id,'name':name,'quantity':1,'price':price}]
      try {
        const {data:insertData,error:insertError} = await supabase.from('cart').insert({items,customer_id}).select();
        if(insertData){
          res.status(201).json({
            message:"Succesfully created cart and added product !!!",
            data:insertData,
          })
        }else{
          throw insertError;
        }
      } catch (error) {
        res.status(500).json({
          message:"Couldn't create cart",
          error: error.message
        })
      }
    }
  } catch (error) {
    res.status(500).json({
      message:"Couldn't fetch cart",
      error: error.message
    })
  }

})

app.post("/delete-from-cart",async(req,res)=>{
  const {id,customer_id}=req.body;
  try {
    const {data:carts,error:fetchError}=await supabase.from('cart').select('items').eq('customer_id',customer_id);
    const cart=carts && carts.length!=0 ? carts[0]:null;
    if(cart){
      let items= cart.items?.length==0 ? [] : cart.items;
      items=items.map((item)=>{
        if(item.p_id==id){
          if(item.quantity==1){
            return null;
          }else{
            return {...item,quantity:item.quantity-1}
          }
        }
      })
      try {
        const {data:updatedCart,error:updateError}=await supabase.from('cart').update({items}).eq('customer_id',customer_id).select();
        if(updatedCart){
          res.status(201).json({
            message:"Item successfully deleted !!!",
            data:updatedCart
          })
        }else throw updateError
      } catch (error) {
        res.status(500).json({
          message:"Item could not be deleted !!!",
          error:error
        })
      }
    }else{
      throw fetchError;
    }
  } catch (error) {
    res.status(500).json({
      message:"Cart could not be fetched",
      error:error
    })
  }
})


const PORT = 5001;
app.listen(PORT, () => {
  console.log(`The server is running on port ${PORT}`);
});
