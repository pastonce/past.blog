## 枚举

> * 枚举是给一系列值命名的方法，还可以将一组数值集合作为类型
> * 枚举数本质上是一个整数，使用枚举可以使代码更易于阅读

* 枚举的类型**只能为整型或字符型**，如不指定类型则默认 32 位整数
* 枚举数的值默认从 0 开始，默认依次递增 1

```c++
#include <iostream>

class Log{
public:
	enum Level // 枚举替代简单整型定义
    {
    	Error = 0, Warning, Info  
    };
private:
    Level m_LogLevel = Info;
public:
    void SetLogLevel(Level level) {
        m_LogLevel = level;
    }
    void error(const char* message) {
        if (m_LogLevel >= Error) {
            std::cout << "[ERROR]: " << message << std::endl;
        }
    }
    void warn(const char* message) {
        if (m_LogLevel >= Warn) {
            std::cout << "[WARN]: " << message << std::endl;
        }
    }
    void info(const char* message) {
        if (m_LogLevel >= Info) {
            std::cout << "[INFO]: " << message << std::endl;
        }
    }
};

int main() {
	Log log;
    
	log.SetLogLevel(Log::Error); // 注意 Error 实际上位于 Log 的命名空间中，也意味着不能与方法重名
	...
	return 0;
}
```

将[[C++自学 5] | C++类-1-概念与定义](https://past-blog.vercel.app/blog/class-1)中初步实现的Log类用枚举进行更新，如上。枚举替代简单整型定义的好处在于：限制重要变量的整数取值范围；名字替代整数，可以增加代码可读性。

## 构造函数与析构函数

> * 构造函数是类中一种特殊类型的方法，**在每次实例化对象时运行**（战吼）；相当于一个自动调用的初始化函数，类似于python中的\_\_init\_\_函数
> * 与构造函数相反，析构函数**在每次销毁对象时运行**（亡语）；一般用来清理分配的内存，避免内存泄漏

* 构造函数没有返回类型，且它的函数名必须与类的名称相同；析构函数也没有返回类型，且它的函数名必须为`~`加上类的名称
* 如不指定构造函数，每个类默认有一个空的构造函数
* 构造函数可以重载，即同名但有不同的参数组合，提供不同的初始化选择
* 析构函数在代码上可以单独调用，但很不常见
* 构造函数仅在实例化对象时运行，因此调用类的静态方法（详见[[C++自学 6] | C++中的static关键字](https://past-blog.vercel.app/blog/static-keyword)）时不会有初始化操作

```c++
#include <iostream>

class Entity {
public:
    float X, Y;
    
    Entity() {
        X = 0.0f;
        Y = 0.0f;
    }
    Entity(float x, float y) { // 构造函数重载
        X = x;
        Y = y;
        std::cout << "Entity Created!" << std::endl;
    }
    ~Entity() {
        std::cout << "Entity Destroyed!" << std::endl;
    }
    
    void Print() {
        std::cout << X << ", " << Y << std:endl;
    }
};

void Function() {
    Entity e1; // Entity Created!
    e1.Print(); // 0, 0
    
    Entity e2(10.0f, 5.0f); // Entity Created!
    e2.Print(); // 10, 5
}

int main() {
    Function(); // Entity Destroyed! * 2
}
```

如果只允许调用类的静态方法而不希望实例化对象，有两种方法：

* 将空构造函数放入私有成员中
* 删除构造函数

```c++
class Log {
private:
    Log() {}
public:
    // Log() = delete;
    static void Error () {
        ...
    }
}

int main() {
    Log::Error();
    Log log; // 此处会报错
}
```