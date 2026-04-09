## new关键字

> * new关键字的主要目的是在堆上分配(malloc)内存，但C++不提供自动清理机制，需要delete手动释放(free)
> * 除了分配内存，new关键字还会调用构造函数；同样地，delete关键字会调用析构函数

**`new`相当于`malloc`+构造函数；`delete`相当于`free`+析构函数**

```c++
#include <iostream>
#include <string>
using String = std::string

class Entity {
private:
    String m_Name;
public:
    Entity() : m_Name("Unkonwn") {}
    Entity(const String& name) : m_Name(name) {}
    
    const String& GetName() const { return m_Name; }
};

int main() {
    int a = 2; // 栈上创建
    int* b = new int[50]; // 堆上创建
    
    Entity e1; // 栈上创建
    Entity* e2 = new Entity(); // 堆上创建
    
    delete[] b;
    delete e2;
}
```

### this关键字

`this`是一个指向当前对象实例的**指针常量**，使得可以在成员函数中引用当前对象实例。

```c++
#include <iostream>

void SomeMethod(Entity* e);

class Entity {
public:
    int x, y;
    
    Entity(int x, int y) {
        this->x = x;
        this->y = y;
        
        SomeMethod(this);
    }
    int GetX() const {
        // this->x = 2; // 不合法
        return this->x;
    }
};

void SomeMethod(Entity* e) {
    
}
```

* 上述代码中，在`Entity`构造函数内，`this`的类型为`Entity*`
* 在`GetX() const`函数内，`this`的类型为`const Entity*`

## 运算符重载

> * 运算符是一种支持特定操作的符号，可以看做是一种特殊的小函数
> * 运算符的重载本质上是给运算符赋予新的语义和功能

运算符重载的一般格式类似于定义函数，**`返回值类型 operator运算符(参数组合){函数体}`**。下述代码重载了`+`、`*`、`==`、`<<`四种运算符

```c++
#include <iostream>

struct Vector2 {
    float x, y;
    
    Vector2(float x, float y)
        : x(x), y(y) {}
    Vector2 Add(const Vector2& other) const {
        return Vector2(x + other.x, y + other.y);
    }
    Vector2 operator+(const Vector2&other) const { // 重载+
        return Add(other);
    }
    Vector2 Multiply(const Vector2& other) const {
        return Vector2(x * other.x, y * other.y);
    }
    Vector2 operator*(const Vector2& other) const { // 重载*
        return Multiply(other);
    }
    bool operator==(const Vector2& other) const { // 重载==
        return x == other.x && y == other.y;
    } 
};

std::ostream& operator<<(std::ostream& stream, const Vector2& other) { // 重载<<
    stream << "(" << other.x << ", " << other.y << ")";
    return stream;
}

int main() {
    Vector2 position(4.0f, 4.0f);
    Vector2 speed(0.5f, 1.5f);
    Vector2 powerup(1.1f, 1.1f);
    
    Vector2 result1 = position.Add(speed.Multiply(powerup)); // 使用函数
    Vector2 result2 = position + speed * powerup; // 使用重载运算符

    std::cout << result1 << std::endl; // (4.55, 5.65)
    std::cout << (result1 == result2) << std::endl; // 1
}
```

* 运算符重载之后，代码可读性增强，且语句的语义更加明确
* 重载并**不改变**运算符默认的优先级，如上述代码中的`+`和`*`