## 在类和结构体外部

* 被修饰的变量或函数**只会在本翻译单元内部链接**，链接器不会在该翻译单元的作用域之外寻找其符号定义。（类似于该文件的`private`成员）
* 在头文件中定义静态变量，并将头文件`include`到两个不同的翻译单元中时，相当于两个翻译单元各有一个同名的私有变量，因此可以正常编译

## 在类和结构体内部

* 被修饰的变量或方法将**被该类创建的所有实例共享**，即该静态变量或方法仅有一个实例（类似于[末影箱](https://zh.minecraft.wiki/w/%E6%9C%AB%E5%BD%B1%E7%AE%B1)）
* 通过类的实例来引用静态变量是没有意义的，因为**静态变量直属于类本身**
* 静态方法没有必要通过类的实例来调用，在静态方法内部也不能访问非静态变量，因为**静态方法没有类实例**（每个非静态方法总是获得当前类的一个实例作为参数，而静态方法不会）

```c++
#include <iostream>

class Entity {
public:
	static int x, y;
    
    void print() {
    	std::cout << x << ", " << y << std::endl;
    }
};

int Entity::x;
int Entity::y;

int main() {
    Entity e1, e2;
    e1.x = 2;	// 应写为 Entity::x = 2;
    e1.y = 5;	// 应写为 Entity::y = 5;
    e2.x = 3;	// 应写为 Entity::x = 3;
    e2.y = 8;	// 应写为 Entity::y = 8;
    
    e1.print();	// 3, 8
    e2.print(); // 3, 8
}
```

如果将上述类定义改为如下结构，则会报错，因为静态函数使用了基于对象实例的非静态变量，且在调用方法时应写为`Entity::print();`

```c++
class Entity {
public:
    int x, y;
    
    static void print() {
        std::cout << x << ", " << y << std::endl;
    }
};
```

## 局部静态变量

* 变量有生存期和作用域两个重要概念，生存期指变量实际存在的时间，而作用域则代表变量可以被访问的范围
* 静态局部变量的生存期**相当于整个程序的生存期**，但其作用域则被局限在当前函数、`if`语句等单元内
* 静态局部变量功能上类似于类和构造体内部的静态变量，也可以使构造单例类（只有一个实例的类，常用于整个系统的初始化等）更加方便

```c++
#include <iostream>

class Singleton {
public:
    static Singleton& Get() {
        static Singleton instance;	// 静态局部变量
        return instance;
    }
    void Hello() {}
    // 其他方法
};

void Function() {
	static int i = 0;	// 静态局部变量
	i++;
	std::cout << i << std::endl;
}

int main() {
	Function(); // 1
	// i = 10，该语句会报错，因为此处不是该变量的作用域
	Function(); // 2
	Function(); // 3
	Function(); // 4
	Function(); // 5
    Singleton::Get().Hello(); // 每次调用均是同一个实例
}
```

**感觉`static`关键字提供了一种介于局部变量和全局变量之间的一种变量状态，允许在有限制的条件下共享某一函数或变量*
